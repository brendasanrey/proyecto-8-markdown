const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const links = [];

const checkPath = (url) => {
  if (path.isAbsolute(url)) {
    return url;
  }
  return path.resolve(url);
};

const checkLink = () => {
  links.forEach((link) => {
    fetch(link.href)
      .then((response) => {
        console.log(response.status);
      }).catch((error) => {
        console.log(error);
      });
  });
};

fs.readFile('README.md', 'utf-8', (error, data) => {
  if (error) {
    console.log('Error', error);
  } else {
    let lines = 0;
    const newString = data.split('\n');
    newString.forEach((element) => {
      lines++;
      const index = element.indexOf('http');
      if (index !== -1) {
        const link = element.slice(element.indexOf('(') + 1, element.indexOf(')'));
        links.push({
          line: lines,
          href: link,
          text: element.slice(element.indexOf('[') + 1, element.indexOf(']')),
          status: '',
        });
      }
    });
    console.log(links);
  }
});



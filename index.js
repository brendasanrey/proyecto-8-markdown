const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');
const marked = require('marked');

const filterLinks = (array) =>{
  let links = false;
  array.forEach(line =>{
    const openingBracket = line.indexOf('(');
    const closingBracket = line.indexOf(')');
    if (openingBracket !== -1 && closingBracket !== -1){
      if(line.indexOf('http') != -1){
        links = new Object;
        links.text = line.slice(line.indexOf('[') + 1, line.indexOf(']'));
        links.href = line.slice(line.indexOf('http'), line.lastIndexOf(')'));
      }
    }
  })
  return links;
}


const mdLinks = (userPath) => {
  const mdLinksArrays = [];
  absolutePath = path.resolve(userPath);
  fs.readFile(absolutePath, 'utf-8', (error, data) => {
    if (error) {
      console.log(error);
    } else {
      const token = marked.lexer(data);
      token.forEach(token =>{
        if(token.type === 'paragraph' || token.type === 'text'){
          const newArray = token.text.split('\n');
            const links = filterLinks(newArray, absolutePath);
            if(links !== false){
              links.file = absolutePath; 
              links.status = '';
              mdLinksArrays.push(links);   
            }
          } 
        }); 
      checkStatus(mdLinksArrays);
      }
    });
}

const checkStatus = links => {
  links.forEach(link =>{
    fetch(link.href)
    .then(response =>{
      link.status = response.status;
      console.log(link);
    });
  }); 
};

getArguments = () =>{
  const listOfArgs = process.argv;
  mdLinks(listOfArgs[2]);
}

getArguments();



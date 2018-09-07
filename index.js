const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');
const marked = require('marked');
const colors = require('colors');
const logSymbols = require('log-symbols');

const listOfArgs = process.argv;
const filePath = listOfArgs[2];
const validate = listOfArgs[3];

const filterLinks = array => {
  let links = false;
  array.forEach(line => {
    const openingBracket = line.indexOf('(');
    const closingBracket = line.indexOf(')');
    if (openingBracket !== -1 && closingBracket !== -1) {
      if (line.indexOf('http') !== -1) {
        links = {};
        links.text = line.slice(line.indexOf('[') + 1, line.indexOf(']'));
        links.href = line.slice(line.indexOf('http'), line.lastIndexOf(')'));
      }
    }
  });
  return links;
};

const mdLinks = absolutePath => {
  const mdLinksArrays = [];
  if (path.extname(absolutePath) === '.md') {
    fs.readFile(absolutePath, 'utf8', (error, data) => {
      if (error) {
        console.log(error);
      } else {
        const tokens = marked.lexer(data);
        tokens.forEach(token => {
          if (token.type === 'paragraph' || token.type === 'text') {
            const newArray = token.text.split('\n');
            const links = filterLinks(newArray);
            if (links !== false) {
              links.file = absolutePath;
              links.status = '';
              mdLinksArrays.push(links);
            }
          }
        });
        checkStatus(mdLinksArrays, absolutePath);
      }
    });
  } else {
    console.log(logSymbols.warning, ` Archivo analizado Inválido: ${absolutePath}`.red);
  }
};

const checkStatus = linksArray => {
  linksArray.forEach(link => {
    if (validate === '--validate') {
      fetch(link.href).then(response => {
        link.status = response.status;
        if (link.status === 200) {
          console.log('*Archivo:'.underline, link.file, '||', 'Texto: '.underline, link.text, '||', 'Enlace:'.underline, link.href, '||', `Estatus: ${link.status}`.underline.green, logSymbols.success);
        } else {
          console.log('*Archivo:'.underline, link.file, '||', 'Texto: '.underline, link.text, '||', 'Enlace:'.underline, link.href, '||', `Estatus: ${link.status}`.underline.red, logSymbols.error);
        }
      }).catch(error => {
        console.log('*Archivo:'.underline, link.file, '||', 'Texto: '.underline, link.text, '||', 'Enlace:'.underline, link.href, '||', 'Estatus: Fail'.underline.red, logSymbols.error);
      });
    } else {
      console.log('*Archivo:'.underline, link.file, '||', 'Texto: '.underline, link.text, '||', 'Enlace:'.underline, link.href);
    }
  });
};

const checkPath = filePath => {
  const absolutePath = path.resolve(filePath);
  const stats = fs.statSync(absolutePath);
  const checkFile = stats.isFile();
  const checkDirectory = stats.isDirectory();
  if (checkFile) {
    mdLinks(absolutePath);
  }
  if (checkDirectory) {
    fs.readdir(absolutePath, 'utf8', (error, files) => {
      if (error) {
        console.log(error);
      } else {
        files.forEach(file => {
          mdLinks(`${absolutePath}\\${file}`);
        });
      }
    });
  }
};

checkPath(filePath);
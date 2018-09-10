const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');
const marked = require('marked');
const colors = require('colors');
const logSymbols = require('log-symbols');

const listOfArgs = process.argv;
const filePath = listOfArgs[2];
let validate = listOfArgs[3];
let stats = listOfArgs[4];

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
  let arrayLength = linksArray.length;
  const options = {};
  if (validate === undefined) {
    options.validate = false;
  } else if (validate.indexOf('--validate') !== -1) {
    options.validate = true;
  }
  if (stats === undefined) {
    options.stats = false;
  } else if (stats.indexOf('--stats') !== -1) {
    options.stats = true;
  }
  let unique = 0;
  let broken = 0;
  let total = linksArray.length;

  linksArray.forEach(link => {
    fetch(link.href)
      .then(response => {
        arrayLength--;
        let result = '';
        link.status = response.status;
        if (options.validate) {
          if (link.status === 200) {
            result = `${colors.underline('Archivo:')} ${link.file} || ${colors.underline('Texto:')} ${link.text} || ${colors.underline('Enlace:')} ${link.href} || ${colors.green('Estatus:')} ${colors.green(link.status)} ${colors.green(logSymbols.success)}`;
          } else {
            result = `${colors.underline('Archivo:')} ${link.file} || ${colors.underline('Texto:')} ${link.text} || ${colors.underline('Enlace:')} ${link.href} || ${colors.red('Estatus:')} ${colors.red(link.status)} ${colors.red(logSymbols.error)}`;
          }
        } else {
          result = `${colors.underline('Archivo:')} ${link.file} || ${colors.underline('Texto:')} ${link.text} || ${colors.underline('Enlace:')} ${link.href}`;
        }
        if (options.stats) {
          if (link.status === 200) {
            unique++;
          } else {
            broken++;
          }
        }
        console.log(result);
        if (options.stats) {
          if (arrayLength === 0) {
            console.log(`${colors.cyan('STATS: Unique ->')} ${colors.cyan(unique)} || ${colors.cyan('Broken ->')} ${colors.cyan(broken)}`);
          }
        }
      }).catch(error => {
        console.log(error);
      });
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
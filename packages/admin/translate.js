const fs = require('fs');

async function run() {
  const { default: translate } = await import('translate');
  translate.engine = 'google'; 

  let fileContent = fs.readFileSync('extracted_i18n.json', 'utf8');
  if (fileContent.charCodeAt(0) === 0xFEFF) {
    fileContent = fileContent.slice(1);
  }
  const data = JSON.parse(fileContent);
  const keys = Object.keys(data);
  
  const arDict = {};
  const frDict = {};
  const enDict = {};
  
  console.log('Total keys to translate: ', keys.length);
  
  keys.forEach(k => {
    let text = k.replace(/_/g, ' ');
    text = text.charAt(0).toUpperCase() + text.slice(1);
    enDict[k] = text;
  });
  
  const textsToTranslate = keys.map(k => enDict[k]);
  
  const chunkSize = 20;
  for (let i = 0; i < textsToTranslate.length; i += chunkSize) {
    const chunk = textsToTranslate.slice(i, i + chunkSize);
    const chunkText = chunk.join(' ||| ');
    
    try {
      console.log(`Translating chunk ${i} to ${i + chunkSize}...`);
      const arResult = await translate(chunkText, { from: 'en', to: 'ar' });
      const frResult = await translate(chunkText, { from: 'en', to: 'fr' });
      
      const arTranslated = arResult.split('|||').map(s => s.trim());
      const frTranslated = frResult.split('|||').map(s => s.trim());
      
      for (let j = 0; j < chunk.length; j++) {
        arDict[keys[i + j]] = arTranslated[j] || chunk[j];
        frDict[keys[i + j]] = frTranslated[j] || chunk[j];
      }
    } catch (e) {
      console.error('Error translating chunk:', e.message);
      for (let j = 0; j < chunk.length; j++) {
        arDict[keys[i + j]] = chunk[j];
        frDict[keys[i + j]] = chunk[j];
      }
    }
    
    await new Promise(r => setTimeout(r, 2000)); // Google translate free endpoint needs delay
  }
  
  fs.writeFileSync('src/locales/ar.json', JSON.stringify(arDict, null, 2));
  fs.writeFileSync('src/locales/fr.json', JSON.stringify(frDict, null, 2));
  fs.writeFileSync('src/locales/en.json', JSON.stringify(enDict, null, 2));
  
  console.log('Done writing translation files.');
}

run();

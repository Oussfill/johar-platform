import json
import time
from deep_translator import GoogleTranslator

with open('extracted_i18n.json', 'r', encoding='utf-8') as f:
    text = f.read()
    if text.startswith('\ufeff'):
        text = text[1:]
    data = json.loads(text)

keys = list(data.keys())

ar_dict = {}
fr_dict = {}
en_dict = {}

print(f"Total keys to translate: {len(keys)}")

for k in keys:
    text = k.replace('_', ' ')
    text = text.capitalize()
    en_dict[k] = text

texts_to_translate = [en_dict[k] for k in keys]
chunk_size = 50

for i in range(0, len(texts_to_translate), chunk_size):
    chunk = texts_to_translate[i:i + chunk_size]
    chunk_text = " ||| ".join(chunk)
    
    try:
        print(f"Translating chunk {i} to {i + chunk_size}...")
        
        ar_translator = GoogleTranslator(source='en', target='ar')
        fr_translator = GoogleTranslator(source='en', target='fr')
        
        ar_result = ar_translator.translate(chunk_text)
        fr_result = fr_translator.translate(chunk_text)
        
        if not ar_result: ar_result = chunk_text
        if not fr_result: fr_result = chunk_text
        
        ar_translated = [s.strip() for s in ar_result.split('|||')]
        fr_translated = [s.strip() for s in fr_result.split('|||')]
        
        # fallback for mismatches
        while len(ar_translated) < len(chunk): ar_translated.append(chunk[len(ar_translated)])
        while len(fr_translated) < len(chunk): fr_translated.append(chunk[len(fr_translated)])
        
        for j in range(len(chunk)):
            ar_dict[keys[i + j]] = ar_translated[j]
            fr_dict[keys[i + j]] = fr_translated[j]
            
    except Exception as e:
        print(f"Error translating chunk: {e}")
        for j in range(len(chunk)):
            ar_dict[keys[i + j]] = chunk[j]
            fr_dict[keys[i + j]] = chunk[j]
            
    time.sleep(2) # be nice to api

with open('src/locales/ar.json', 'w', encoding='utf-8') as f:
    json.dump(ar_dict, f, ensure_ascii=False, indent=2)
with open('src/locales/fr.json', 'w', encoding='utf-8') as f:
    json.dump(fr_dict, f, ensure_ascii=False, indent=2)
with open('src/locales/en.json', 'w', encoding='utf-8') as f:
    json.dump(en_dict, f, ensure_ascii=False, indent=2)

print("Done writing translation files.")

// LEDBASIC — Regresyon Test Seti
// Dil çekirdeğine her dokunuştan sonra çalıştırılır. Amaç: mevcut
// sözdiziminin hiçbir şekilde bozulmadığını kanıtlamak.
const { parse } = require('./parser.js');
const { Interpreter } = require('./interpreter.js');

let pass = 0, fail = 0;
const failures = [];

function test(name, src, expectFn) {
  try {
    const ast = parse(src);
    const events = [];
    const host = {
      getPin: (p, k) => ({ button: 1, pot: 512, ldr: 300, pir: 1, ultrasonic: 25,
                            temp: 22.5, rain: 3, cny70: 800, humidity: 55, humidtemp: 21 })[k] || 0,
      eepromQuery: (op, ee, arg) => (op === 'fileRead' ? 'test' : (op === 'fileExists' ? 1 : 7))
    };
    const interp = new Interpreter(ast, host);
    const gen = interp.run();
    let res = gen.next(), steps = 0;
    while (!res.done && steps < 5000) { events.push(res.value); res = gen.next(); steps++; }
    const result = expectFn(events, ast);
    if (result === true) { pass++; }
    else { fail++; failures.push(name + ' -> ' + result); }
  } catch (e) {
    fail++; failures.push(name + ' -> HATA: ' + e.message + (e.line ? ' (satır ' + e.line + ')' : ''));
  }
}

const prints = (evs) => evs.filter(e => e.type === 'print').map(e => e.value);
const pins = (evs) => evs.filter(e => e.type === 'pin').map(e => e.kind + ' ' + e.pin);

// ---------- TEMEL DİL ----------
test('değişken ve yazdır', 'DEGISKEN x = 5\nYAZDIR x',
  e => prints(e).join() === '5' || 'beklenen 5, gelen ' + prints(e));

test('LET ile atama', 'LET y = 10\nYAZDIR y',
  e => prints(e).join() === '10' || 'gelen ' + prints(e));

test('LET olmadan atama', 'z = 3\nz = z + 4\nYAZDIR z',
  e => prints(e).join() === '7' || 'gelen ' + prints(e));

test('aritmetik', 'YAZDIR 2 + 3 * 4',
  e => prints(e).join() === '14' || 'gelen ' + prints(e));

test('karşılaştırma tek =', 'EGER 5 = 5 ISE\n YAZDIR 1\nBITTI',
  e => prints(e).join() === '1' || 'gelen ' + prints(e));

test('string', 'YAZDIR "merhaba"',
  e => prints(e).join() === 'merhaba' || 'gelen ' + prints(e));

// ---------- ÇOK SATIRLI IF (bozulmamalı) ----------
test('çok satırlı IF-BITTI', 'EGER 1 = 1 ISE\n  YAK LED1\nBITTI',
  e => pins(e).join() === 'HIGH LED1' || 'gelen ' + pins(e));

test('çok satırlı IF-YOKSA', 'EGER 1 = 2 ISE\n  YAK LED1\nYOKSA\n  SONDUR LED2\nBITTI',
  e => pins(e).join() === 'LOW LED2' || 'gelen ' + pins(e));

test('IF-ELSEIF zinciri', 'EGER 1 = 2 ISE\n YAK LED1\nELSEIF 1 = 1 ISE\n YAK LED2\nYOKSA\n YAK LED3\nBITTI',
  e => pins(e).join() === 'HIGH LED2' || 'gelen ' + pins(e));

test('İngilizce IF-THEN-ELSE-ENDIF', 'IF 1 = 2 THEN\n  HIGH LED1\nELSE\n  LOW LED2\nENDIF',
  e => pins(e).join() === 'LOW LED2' || 'gelen ' + pins(e));

test('iç içe IF', 'EGER 1 = 1 ISE\n  EGER 2 = 2 ISE\n    YAK LED1\n  BITTI\nBITTI',
  e => pins(e).join() === 'HIGH LED1' || 'gelen ' + pins(e));

// ---------- DÖNGÜLER ----------
test('FOR döngüsü', 'DEGISKEN t = 0\nDONGU i = 1 KADAR 5\n  t = t + i\nSONRAKI\nYAZDIR t',
  e => prints(e).join() === '15' || 'gelen ' + prints(e));

test('FOR STEP', 'DEGISKEN t = 0\nDONGU i = 0 KADAR 10 ADIM 2\n  t = t + 1\nSONRAKI\nYAZDIR t',
  e => prints(e).join() === '6' || 'gelen ' + prints(e));

test('WHILE döngüsü', 'DEGISKEN n = 0\nIKEN n < 3\n  n = n + 1\nBITTI\nYAZDIR n',
  e => prints(e).join() === '3' || 'gelen ' + prints(e));

test('BREAK', 'DEGISKEN n = 0\nIKEN DOGRU\n  n = n + 1\n  EGER n = 4 ISE\n    DUR\n  BITTI\nBITTI\nYAZDIR n',
  e => prints(e).join() === '4' || 'gelen ' + prints(e));

test('GOTO ve etiket', 'DEGISKEN c = 0\nbas:\n  c = c + 1\n  EGER c < 3 ISE\n    GIT bas\n  BITTI\nYAZDIR c',
  e => prints(e).join() === '3' || 'gelen ' + prints(e));

// ---------- BİLEŞEN KOMUTLARI (hepsi parse edilmeli) ----------
test('LED komutları', 'YAK LED1\nSONDUR LED1\nDEGISTIR LED1\nRENKAYARLA LED1, 255, 0, 0',
  e => pins(e).length === 3 || 'gelen pin sayısı ' + pins(e).length);

test('LCD komutları', 'LCDYAZ EK1, "test"\nLCDTEMIZLE EK1\nLCDNOKTA EK1, 1, 2\nLCDCIZGI EK1, 0,0,5,5\nLCDDIKDORTGEN EK1,0,0,3,3\nLCDDAIRE EK1,4,4,2\nLCDIMLEC EK1,0,0',
  e => e.filter(x => x.type && x.type.indexOf('lcd_') === 0).length === 7 || 'gelen ' + e.filter(x => x.type && x.type.indexOf('lcd_') === 0).length);

test('7-segment komutları', 'SEGYAZ S1, 42\nSEGYAK S1, 0, a\nSEGSONDUR S1, 0, g\nSEGTEMIZLE S1',
  e => e.filter(x => x.type && x.type.indexOf('seg_') === 0).length === 4 || 'hata');

test('matrix komutları', 'MATRIXNOKTA M1,1,1\nMATRIXCIZGI M1,0,0,7,7\nMATRIXDIKDORTGEN M1,0,0,3,3\nMATRIXDAIRE M1,4,4,2\nMATRIXTEMIZLE M1\nMATRIXRENK M1,0,0,255,0,0',
  e => e.filter(x => x.type && x.type.indexOf('matrix_') === 0).length === 6 || 'hata');

test('motor komutları', 'DCYAK M1, 200\nDCTERSYAK M1, 100\nDCDUR M1\nSERVOYAZ SV1, 90\nSTEPADIM ST1, 200\nSTEPHIZ ST1, 50',
  e => e.filter(x => ['dc_on','dc_stop','servo_write','step_move','step_speed'].includes(x.type)).length === 6 || 'hata');

test('sensör okumaları', 'YAZDIR BUTON(B1)\nYAZDIR POT(P1)\nYAZDIR ISIK(L1)\nYAZDIR HAREKET(PR1)\nYAZDIR ULTRASON(U1)\nYAZDIR SICAKLIK(T1)\nYAZDIR YAGMUR(R1)\nYAZDIR CNY70(C1)\nYAZDIR NEM(H1)\nYAZDIR NEMSICAKLIK(H1)',
  e => prints(e).join(',') === '1,512,300,1,25,22.5,3,800,55,21' || 'gelen ' + prints(e).join(','));

test('EEPROM komutları', 'EEPROMYAZ EE1, 0, 65\nEEPROMTEMIZLE EE1\nDOSYAYAZ EE1,"a.txt","x"\nDOSYASIL EE1,"a.txt"\nYAZDIR EEPROMOKU(EE1,0)\nYAZDIR DOSYAOKU(EE1,"a.txt")\nYAZDIR DOSYAVARMI(EE1,"a.txt")',
  e => prints(e).join(',') === '7,test,1' || 'gelen ' + prints(e).join(','));

test('BEKLE komutu', 'BEKLE 100',
  e => e.filter(x => x.type === 'pause').length === 1 || 'hata');

test('mantıksal operatörler', 'EGER 1 = 1 VE 2 = 2 ISE\n YAZDIR 1\nBITTI\nEGER 1 = 2 VEYA 3 = 3 ISE\n YAZDIR 2\nBITTI',
  e => prints(e).join(',') === '1,2' || 'gelen ' + prints(e).join(','));

test('GOSUB/RETURN', 'CAGIR alt\nYAZDIR 9\nGIT son\nalt:\n YAZDIR 1\nDON\nson:',
  e => prints(e).join(',') === '1,9' || 'gelen ' + prints(e).join(','));

// ---------- SONUÇ ----------
console.log('='.repeat(50));
console.log('GEÇEN: ' + pass + '   KALAN: ' + fail);
if (failures.length) {
  console.log('\nBAŞARISIZ TESTLER:');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
} else {
  console.log('TÜM TESTLER GEÇTİ ✓');
}

# LEDBASIC

**Tarayıcıda çalışan, kendi programlama diline sahip elektronik simülatörü.**

🇬🇧 [English README](README-EN.md)

LEDBASIC ile tek bir kablo bağlamadan devre kurup programlarsın. Pin numarası,
direnç hesabı, datasheet yok — bileşenleri breadboard'a bırakır, adıyla çağırır,
doğrudan mantığa odaklanırsın.

```basic
EGER ISIK(SENSOR1) < 300 ISE ROLEAC ROLE1 YOKSA ROLEKAPAT ROLE1
```

Bu tam bir sokak lambası kontrolcüsü. Tek satır.

---

## Neden

Elektronik öğrenmek çoğunlukla kabloda tıkanır. "Karanlık olunca lamba yansın"
fikrini denemek isteyen biri önce gerilim bölücüyle, ADC piniyle, flyback diyoduyla,
optokuplörle boğuşmak zorunda kalır. Fikir daha çalışmadan ölür.

LEDBASIC bu duvarı kaldırır. Önce **mantığı** öğrenirsin; donanım sonra gelir ve o
zaman kafanda kabloyu bağlayacağın, zaten çalışan bir model olur.

---

## Hızlı başlangıç

`ledbasic.html` dosyasını indir ve tarayıcıda aç. Hepsi bu.

- Kurulum yok, derleme yok, bağımlılık yok
- Tek parça dosya (~500 KB)
- Çevrimdışı çalışır
- Telefonda çalışır — nitekim bu projenin tamamı telefonla geliştirildi

---

## İçinde ne var

### 23 bileşen türü

| Kategori | Bileşenler |
|---|---|
| **Çıkışlar** | LED (RGB, serbest renk), güç LED'i (PWM ile kısılabilir), LED şerit (adreslenebilir RGB veya tek renk, 8–60 LED), röle (1/2/4/8 kanal + SSR) |
| **Girişler** | Buton, darbe buton (tek tetiklemeli), potansiyometre |
| **Ekranlar** | Karakter LCD (16×2, 20×4), grafik LCD (128×64), 7-segment (1–8 hane), LED matrix (8×8'den 32×8'e, tek renk veya RGB), LED tabela (kayan yazı, 5 boyut) |
| **Motorlar** | DC motor (PWM hız + yön), servo (0–180°), step motor (zamana yayılı gerçekçi adımlama) |
| **Sensörler** | LDR, PIR, HC-SR04 ultrasonik, termostat, yağmur, CNY70, DHT11 |
| **Ses** | Aktif/pasif buzzer, sounder, hoparlör — Web Audio ile gerçek ses |
| **Depolama** | İki katmanlı dosya sistemli EEPROM |

### Dil

PIC BASIC'ten esinlenilmiştir ve **her komutun hem Türkçe hem İngilizce karşılığı
vardır** (312 yazım, 110 komut). Büyük/küçük harf farketmez.

```basic
// Koşullar
EGER x > 5 ISE YAK LED1 YOKSA SONDUR LED1     // tek satır
DURUM secim
    OLURSA 1
    OLURSA 2, 3
    OLURSA 5 KADAR 9
    DIGER
BITTI

// Döngüler
ICIN i = 0 KADAR 10 ADIM 2 ... SONRA i
IKEN kosul ... IKENBITIR

// Veri
DIZI skorlar[10]
KAYIT Oyuncu
    isim
    skor
BITTI
DEGISKEN p = YENI Oyuncu
p.skor = 100

// Yerel kapsamlı, tekrar kullanılabilir kod
ALTPROGRAM yanip_son(led, sure)
    YAK led
    BEKLE sure
    SONDUR led
BITTI

FONKSIYON kdvli(f)
    DONDUR f * 120 / 100
BITTI
```

Ayrıca: onaltılık/ikilik sayı yazımı (`&HFF`, `&B1010`), BASIC operatörleri
(`^`, `MOD`, `\`, `<>`), metin fonksiyonları, matematik fonksiyonları ve oyun
yardımcıları (çarpışma algılama, sınırlama, sarmalama, desen çizimi, piksel okuma).

### Temelin ötesinde

- **Çoklu kod sayfası, paylaşılan kapsam** — bir sayfada tanımlanan `ALTPROGRAM`
  diğer bütün sayfalardan çağrılabilir
- **Player çıktısı** — projeni tek başına çalışan bir HTML dosyasına paketler:
  sahnede yalnızca breadboard ve senin adın, program kendiliğinden çalışır,
  editör yok. Proje verisi gzip'lenip gömülür. İstediğin yerde paylaş.
- **Türkçe / İngilizce arayüz** — menüleri, hata mesajlarını *ve* bileşen isim
  öneklerini değiştirir (`BUTON1` ⇄ `BUTTON1`)
- **Kaydet / yükle** — tarayıcı belleğine veya `.json` dosyasına

---

## Testler

Motor ve arayüz, Node.js'te hafif bir DOM taklidi üzerinde çalışan otomatik
testlerle doğrulanır — tarayıcıya gerek yoktur.

```bash
node regression_test.js   # 26 — dil çekirdeği, tüm bileşen komutları
node boot_normal.js       # 16 — uygulama açılışı, palet, editör, sekmeler
node boot.js              # 13 — player modu: çöz, yükle, kendiliğinden çalış
node boot_lang.js         # 14 — dil değiştirme, uçtan uca
```

Referans dökümanındaki **63 kod örneğinin tamamı, yayınlanmadan önce gerçek
ayrıştırıcıdan geçirilir**; komut sözlüğü de elle yazılmayıp doğrudan motorun
kelime tablosundan üretilir. Yani dökümanda var olmayan bir komut bulunamaz.

---

## Döküman

`ledbasic-referans.html` — 19 bölüm, doğrulanmış 63 örnek. İlk programdan tam
projelere kadar (gece lambası, termostat, park sensörü, sayaç, hareket eden nokta).
Tarayıcıda aç; telefonda da rahat okunur.

---

## Bilinen sınırlar

Açıkça yazıyorum, çünkü yalnızca güzel yanları sayan bir README işe yaramaz:

- Her şey 11.000 satırlık tek bir HTML dosyasında. Çalışıyor, ama bir ekibin
  kolayca dahil olacağı bir kod tabanı değil.
- Ses, tarayıcı kuralı gereği kullanıcı dokunmadan başlayamaz. Player modunda
  projede ses varsa bir ipucu gösterilir.
- Otomatik testler davranışı doğrular, görünümü değil. Hizalama, renk ve görsel
  incelik makineyle doğrulanmamıştır.
- `'` yorum karakteri değildir; `//` kullan.

---

## Emeği geçenler

Tasarım ve yönlendirme proje sahibine, kod yazımı Claude'a (Anthropic), planlama
katkısı DeepSeek'e aittir. Tamamı telefonla geliştirilmiştir.

Adı zaten anlatıyor: yanan şey gibi **LED**, gerçekten okunabilen şey gibi **BASIC**.

Denemek için https://seyyidkadir.github.io/Ledbasic/

# 2D Ulaştırma Oyunu

Basit ama oynanabilir bir 2D ulaştırma oyunu. HTML, CSS ve JavaScript kullanılarak geliştirilmiştir.

## Oyun Özellikleri

- HTML, CSS ve JavaScript ile geliştirilmiş, ekstra kütüphane kullanılmamıştır
- HTML Canvas üzerinde çalışan üstten bakışlı (top-down) bir oyun
- Ok tuşlarıyla (↑ ↓ ← →) kontrol edilen kurye karakteri
- Sade bir harita tasarımı (yollar, binalar ve yeşil alanlar)
- Rastgele oluşan paketler ve teslimat noktaları
- Teslimat için zaman sınırı (10 saniye)
- Level sistemi - her 50 puan sonrası level atlama
- Her level'da artan engel sayısı
- Rastgele hareket eden engeller (arabalar, yayalar)
- Rastgele oluşan kalkanlar (3 saniye boyunca engellere çarpmadan ilerleme)
- Puan sistemi ve can sistemi
- Başlangıç ve bitiş ekranları

## Oyun Mekanikleri

- **Paket Alma:** Kırmızı paketleri alarak teslimat noktasını aktifleştirirsiniz
- **Teslimat Yapma:** Paketi aldıktan sonra kırmızı teslimat noktasına ulaştığınızda +10 puan kazanırsınız
- **Zaman Sınırı:** Paketi aldıktan sonra teslimat için 10 saniye süreniz vardır, süre bittiğinde -5 puan kaybedersiniz
- **Level Sistemi:** Her 50 puan sonrası level atlar ve engel sayısı artar
- **Engeller:** Sarı renkli engellere çarpıldığında -3 puan kaybedilir, bir can azalır ve karakter 2 saniye boyunca hareketsiz kalır
- **Kalkanlar:** Mavi renkli kalkanlar rastgele oluşur, toplanıldığında 3 saniye boyunca engellere çarpma koruması sağlar
- **Oyun Sonu:** Canlar bittiğinde oyun sona erer ve skor gösterilir

## Nasıl Oynanır

1. İndeks.html dosyasını bir web tarayıcısında açın
2. "Başla" butonuna tıklayarak oyunu başlatın
3. Ok tuşlarını kullanarak kurye karakterini kontrol edin
4. Kırmızı paketleri toplayın
5. Paketi aldıktan sonra oluşan kırmızı teslimat noktasına ulaşın
6. Sarı engellere çarpmamaya çalışın
7. Mavi kalkanları toplayarak engellere karşı koruma kazanın
8. Teslimat için verilen süre içinde teslimat noktasına ulaşın
9. Level atladıkça artan engellere dikkat edin

## Proje İsterleri

1. HTML, CSS, JavaScript kullanılarak geliştirilmiş, ekstra kütüphane kullanılmamıştır
2. Oyun HTML Canvas üzerinde oynanmaktadır
3. Karakter ok tuşlarıyla kontrol edilmektedir
4. Harita sade bir şekilde tasarlanmış, yollar, binalar ve yeşil alanlar farklı renklerle gösterilmiştir
5. Paketler ve teslimat noktaları haritada rastgele oluşmaktadır
6. Teslimatlar için 10 saniyelik zaman sınırı bulunmaktadır
7. Haritada rastgele hareket eden engeller bulunmaktadır
8. Level sistemi eklenmiş ve her level'da engel sayısı artmaktadır
9. Oyuncu engellere çarptığında puan kaybetmekte ve kısa süre hareketsiz kalmaktadır
10. Skor, level, zaman ve kalan can ekranın üst kısmında gösterilmektedir
11. Oyun masaüstünde düzgün çalışacak şekilde tasarlanmıştır
12. Oyun başlangıç ve bitiş ekranları bulunmaktadır
13. Rastgele oluşan kalkanlar ile 3 saniye boyunca engellere çarpmadan ilerleme özelliği eklenmiştir

## Dosya Yapısı

- **index.html:** Oyunun HTML yapısı
- **style.css:** Oyunun görsel stili
- **game.js:** Oyun mantığı ve mekanikleri
- **README.md:** Proje dokümantasyonu

## Geliştirme Notları

- Oyun responsive tasarlanmamıştır, masaüstü tarayıcılarda en iyi performansı verir
- Oyun ekranı 800x600 piksel boyutundadır
- Engeller yollar üzerinde rastgele hareket etmektedir
- Paketler ve teslimat noktaları sadece yollar üzerinde oluşmaktadır
- Kalkanlar rastgele oluşur ve oyuncuya 3 saniyelik koruma sağlar
- Her level'da engel sayısı 2 adet artmaktadır
import requests

# Buraya o (#100) hatasını aldığında kullandığın (veya Sistem Kullanıcısından aldığın) Token'ı yapıştır
ACCESS_TOKEN = 'IGAANJeJypfORBZAGEteGYzMENLQUx6NGs5Yl8tSTVKU3R0dThkNS1rcXZAXUzRyLVkyam9HaFNfekxtNkc1M0x3OXBrS0ktc2s0ZAWtkdU1QdkxiLW4zakV1U25GQ2J3NzZApNEwxYldDNkZA1NnNPOWpxZA2dmV0VVUE9Ja2xPTHAwVQZDZD'

def bilgileri_bul():
    print("1. Sayfalar ve Instagram Hesapları Aranıyor...")
    url = "https://graph.facebook.com/v25.0/me/accounts"
    params = {'access_token': ACCESS_TOKEN, 'fields': 'id,name,instagram_business_account'}
    
    response = requests.get(url, params=params).json()
    
    if 'data' not in response or len(response['data']) == 0:
        print("Hata: Bu Token'a bağlı bir sayfa bulunamadı. Lütfen Token'ı kontrol et.")
        return

    for page in response['data']:
        print(f"\nBulunan Sayfa: {page.get('name')} (ID: {page.get('id')})")
        
        ig_account = page.get('instagram_business_account')
        if ig_account:
            ig_id = ig_account.get('id')
            print(f"✅ Bağlı Instagram İşletme ID'si Bulundu: {ig_id}")
            
            # Gönderileri Çekiyoruz
            print("\n2. Son Gönderiler Çekiliyor...")
            media_url = f"https://graph.facebook.com/v19.0/{ig_id}/media"
            media_params = {'access_token': ACCESS_TOKEN, 'fields': 'id,caption,shortcode'}
            media_response = requests.get(media_url, params=media_params).json()
            
            if 'data' in media_response:
                for post in media_response['data']:
                    metin = post.get('caption', 'Açıklama yok')[:30] # İlk 30 karakter
                    print(f"Gönderi ID: {post.get('id')} | Açıklama: {metin}...")
            else:
                print("Gönderi bulunamadı veya yetki eksiği var.")
        else:
            print("❌ Bu sayfaya bağlı bir Instagram İşletme hesabı yok.")

bilgileri_bul()
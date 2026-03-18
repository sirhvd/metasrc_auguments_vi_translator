import requests
import json

def fetch_json(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def main():
    url_vi = "https://raw.communitydragon.org/latest/cdragon/arena/vi_vn.json"
    url_en = "https://raw.communitydragon.org/latest/cdragon/arena/en_us.json"

    print("Đang tải dữ liệu...")
    data_vi = fetch_json(url_vi)
    data_en = fetch_json(url_en)

    # Tạo dictionary để tra cứu tên tiếng Anh nhanh hơn qua ID
    en_lookup = {item['id']: item['name'] for item in data_en.get('augments', [])}

    result = []
    
    # Duyệt qua danh sách tiếng Việt để lấy tên VN và Mô tả
    for item in data_vi.get('augments', []):
        aug_id = item['id']
        
        # Chỉ lấy nếu tồn tại ID tương ứng bên bản Anh (để tránh lỗi dữ liệu rác)
        obj = {
            "id": aug_id,
            "vn_name": item['name'],
            "en_name": en_lookup.get(aug_id, "Unknown"),
            "desc": item['desc']
        }
        result.append(obj)

    # Xuất ra file JSON
    with open('augments.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=4)
    
    print(f"Thành công! Đã trích xuất {len(result)} lõi vào file augments.json")

if __name__ == "__main__":
    main()

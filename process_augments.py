import requests
import json

def fetch_json(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Lỗi khi tải {url}: {e}")
        return []

def main():
    # 1. Các URL nguồn
    url_arena_vi = "https://raw.communitydragon.org/latest/cdragon/arena/vi_vn.json"
    url_arena_en = "https://raw.communitydragon.org/latest/cdragon/arena/en_us.json"
    url_cherry_vi = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/vi_vn/v1/cherry-augments.json"
    url_cherry_en = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json"

    print("Đang tải dữ liệu...")
    
    # 2. Fetch dữ liệu
    arena_vi = fetch_json(url_arena_vi)
    arena_en = fetch_json(url_arena_en)
    cherry_vi = fetch_json(url_cherry_vi)
    cherry_en = fetch_json(url_cherry_en)

    # Xử lý format dữ liệu (Arena thường nằm trong key 'augments')
    arena_vi_list = arena_vi.get('augments', []) if isinstance(arena_vi, dict) else []
    arena_en_list = arena_en.get('augments', []) if isinstance(arena_en, dict) else []
    
    # Cherry thường là mảng trực tiếp
    cherry_vi_list = cherry_vi if isinstance(cherry_vi, list) else cherry_vi.get('augments', [])
    cherry_en_list = cherry_en if isinstance(cherry_en, list) else cherry_en.get('augments', [])

    # 3. Logic Merge
    # Bước A: Khởi tạo dữ liệu từ Arena (lấy desc từ đây)
    en_arena_lookup = {item['id']: item.get('name', 'Unknown') for item in arena_en_list if 'id' in item}
    
    merged_data = {}
    for item in arena_vi_list:
        aug_id = item['id']
        merged_data[aug_id] = {
            "id": aug_id,
            "vn_name": item.get('name', ''),
            "en_name": en_arena_lookup.get(aug_id, "Unknown"),
            "desc": item.get('description', '')
        }

    # Bước B: Xử lý Cherry (Ưu tiên ghi đè vn_name, en_name từ nameTRA)
    # Tạo lookup cho tiếng Anh Cherry
    cherry_en_lookup = {item['id']: item.get('nameTRA', 'Unknown') for item in cherry_en_list if 'id' in item}

    for item in cherry_vi_list:
        aug_id = item.get('id')
        if not aug_id: continue
        
        vn_name_tra = item.get('nameTRA', '')
        en_name_tra = cherry_en_lookup.get(aug_id, 'Unknown')

        if aug_id in merged_data:
            # Nếu đã có ID (từ Arena) -> Ghi đè Tên, giữ nguyên Desc
            if vn_name_tra:
                merged_data[aug_id]['vn_name'] = vn_name_tra
            if en_name_tra != 'Unknown':
                merged_data[aug_id]['en_name'] = en_name_tra
        else:
            # Nếu ID mới hoàn toàn (chỉ có trong Cherry) -> Thêm mới, desc rỗng
            merged_data[aug_id] = {
                "id": aug_id,
                "vn_name": vn_name_tra,
                "en_name": en_name_tra,
                "desc": ""
            }

    # 4. Xuất file JSON
    final_list = list(merged_data.values())
    with open('augments.json', 'w', encoding='utf-8') as f:
        json.dump(final_list, f, ensure_ascii=False, indent=4)
    
    print(f"Thành công! Đã xử lý {len(final_list)} lõi.")

if __name__ == "__main__":
    main()

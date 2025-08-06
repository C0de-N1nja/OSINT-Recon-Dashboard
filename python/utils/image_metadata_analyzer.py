import sys
import json
import requests
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from io import BytesIO

def get_exif_data(image_bytes):
    """Extracts and decodes EXIF data from image bytes."""
    exif_data = {}
    try:
        with Image.open(BytesIO(image_bytes)) as img:
            if hasattr(img, '_getexif'):
                exif_info = img._getexif()
                if exif_info:
                    for tag, value in exif_info.items():
                        decoded_tag = TAGS.get(tag, tag)
                        exif_data[decoded_tag] = value
    except Exception:
        return None
    return exif_data

def get_gps_details(exif_data):
    gps_info = {}
    if 'GPSInfo' in exif_data:
        for key, val in GPSTAGS.items():
            if key in exif_data['GPSInfo']:
                gps_info[val] = exif_data['GPSInfo'][key]
        return gps_info
    return None

def convert_to_decimal_degrees(value):
    d, m, s = value
    return d + (m / 60.0) + (s / 3600.0)

def main(image_url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(image_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        exif = get_exif_data(response.content)
        
        if not exif:
            print(json.dumps({"status": "no_exif_data"}))
            return

        results = {}
        tags_to_extract = ['Make', 'Model', 'DateTimeOriginal', 'Software']
        for tag in tags_to_extract:
            if tag in exif:
                results[tag] = str(exif[tag])

        gps_details = get_gps_details(exif)
        if gps_details:
            lat_ref = gps_details.get('GPSLatitudeRef')
            lat = gps_details.get('GPSLatitude')
            lon_ref = gps_details.get('GPSLongitudeRef')
            lon = gps_details.get('GPSLongitude')

            if lat and lat_ref and lon and lon_ref:
                dec_lat = convert_to_decimal_degrees(lat)
                dec_lon = convert_to_decimal_degrees(lon)
                if lat_ref != 'N': dec_lat = -dec_lat
                if lon_ref != 'E': dec_lon = -dec_lon
                
                results['GPS'] = {
                    "Latitude": dec_lat,
                    "Longitude": dec_lon,
                    "map_url": f"https://www.google.com/maps?q={dec_lat},{dec_lon}"
                }

        if not results:
             print(json.dumps({"status": "no_relevant_data_found"}))
        else:
             print(json.dumps(results, indent=2))

    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1])
    else:
        print(json.dumps({"status": "error", "message": "No image URL provided."}))
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{engine::general_purpose, Engine as _};
use std::io::Read;
use tauri::Manager;
use webp::{Encoder, WebPMemory};
use xcap::Monitor;
use std::path::Path;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command(rename_all = "snake_case")]
fn take_screen() -> Vec<Image> {
    let mut result: Vec<Image> = vec![];
    let monitors = Monitor::all().unwrap();
    let mut i = 0;
    for monitor in monitors {
        i += 1;
        let image = monitor.capture_image().unwrap();
        let image_bytes = image.to_vec();
        let encoder: Encoder = Encoder::from_rgba(&image_bytes, image.width(), image.height());
        let encoded_webp: WebPMemory = encoder.encode(65f32);

        let bytes: Vec<u8> = encoded_webp
            .bytes()
            .into_iter()
            .map(|x| x.unwrap())
            .collect();
        let base64 = general_purpose::STANDARD.encode(&bytes);
        result.push(Image::new(
            format!("screen-{}.webp", i),
            "image/webp".to_string(),
            base64,
            image.width(),
            image.height(),
        ));

        //let mut webp_image = File::create(format!("C:\\Temp\\test-screen\\test-{}.webp", i)).unwrap();
        //webp_image.write_all(&bytes).unwrap();
    }
    result
}

#[tauri::command(rename_all = "snake_case")]
fn convert_webp(source: Image) -> Image {
    let image_bytes = general_purpose::STANDARD.decode(source.content).unwrap();
    let encoder: Encoder = Encoder::from_rgba(&image_bytes, source.width, source.height);
    let encoded_webp: WebPMemory = encoder.encode(65f32);

    let bytes: Vec<u8> = encoded_webp
        .bytes()
        .into_iter()
        .map(|x| x.unwrap())
        .collect();
    let base64 = general_purpose::STANDARD.encode(&bytes);
    let file_name = Path::new(&source.name).file_stem().unwrap().to_str().unwrap();
    Image::new(
        format!("{}.webp", file_name),
        "image/webp".to_string(),
        base64,
        source.width,
        source.height,
    )
}

fn main() {
    #[cfg(debug_assertions)]
    let devtools = devtools::init(); // initialize the plugin as early as possible

    let mut builder = tauri::Builder::default();
    builder = builder
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            #[cfg(debug_assertions)] // n'incluez ce code que sur les versions de débogage
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![take_screen, convert_webp]);
    #[cfg(debug_assertions)]
    {
        builder = builder.plugin(devtools);
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(serde::Serialize, serde::Deserialize)]
struct Image {
    name: String,
    content_type: String,
    content: String,
    width: u32,
    height: u32,
}

impl Image {
    pub fn new(
        name: String,
        content_type: String,
        content: String,
        width: u32,
        height: u32,
    ) -> Image {
        Image {
            name,
            content_type,
            content,
            width,
            height,
        }
    }
}

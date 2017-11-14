extern crate serde_json;

use std::io::Read;
use std::io::{self, Write};
use std::mem::transmute;

use serde_json::{Value, Error};

fn parse_data(data: &mut String, url: &mut String) -> Result<(), Error> {
    // Parse the string of data into serde_json::Value.
    let v: Value = serde_json::from_str(data)?;
    
    url.push_str(v["url"].as_str().unwrap_or(&"url parse error"));

    Ok(())
}


enum ProcessResult {
    Ok = 0,
    Err = 1,
    Invalid = 2,
}

fn write_len(l: usize) -> std::result::Result<usize, std::io::Error> {
    let d = l as u32;
    let bytes: [u8; 4] = unsafe {
        transmute(d) // or .to_be()
    };
    
    io::stdout().write(&bytes)
}

fn write_message(msg: &str) -> std::result::Result<usize, std::io::Error> {
    write_len(msg.len())?;
    io::stdout().write(String::from(msg).as_bytes())
}

fn send_message(url: &str, target: &str, result: ProcessResult, desc: &str) {
    let rc = result as u8;
    let msg = format!("{{\"url\": \"{}\", \"target\": \"{}\", \"result\": {}, \"desc\": \"{}\"}}", url, target, rc, desc);
    
    match write_message(&msg) {
        Ok(_) => {},
        Err(e) => eprintln!("{:?}", e),
    }
}

fn read_len() -> std::result::Result<usize, std::io::Error> {
    let mut bytes = [0u8; 4];
    
    std::io::stdin().read_exact(&mut bytes)?;
    
    let l: u32 = unsafe {
        transmute(bytes)
    };
    
    Ok(l as usize)
}

fn read_data(data: &mut Vec<u8>) -> Option<usize> {
    let mut bytes = std::io::stdin().bytes();
    
    for i in 0..data.len() {
        if let Some(Ok(b)) = bytes.next() {
            data[i] = b;
        } else {
            return None;
        }
    }
    
    Some(data.len())
}

fn read_message(content: &mut String) -> Option<usize> {
    if let Ok(promised_len) = read_len() {
        let mut data = vec![0u8; promised_len];
        if let Some(len) = read_data(&mut data) {
            if let Ok(mut text) = String::from_utf8(data) {
                match parse_data(&mut text, content) {
                    Ok(_) => {},
                    Err(_) => content.push_str(&"parse error"),
                }
                
                return Some(len);
            }
        }
    }
    None
}


fn main() {
    let mut result = ProcessResult::Ok;
    let mut content = String::new();
    let desc = match read_message(&mut content) {
        Some(l) => {
            if l == 0 {
                result = ProcessResult::Invalid;    
            }
            format!("{} - {}", l, content)
        },
        None => {
            result = ProcessResult::Err;
            String::from("-1")
        }
    };
    
    send_message("", "", result, &desc);
}

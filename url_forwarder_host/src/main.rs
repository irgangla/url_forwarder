use std::io::Read;
use std::io::{self, Write};
use std::mem::transmute;

enum ProcessResult {
    Ok = 0,
    Err = 1,
    Invalid = 2,
}

fn write_len(l: usize) -> std::result::Result<usize, std::io::Error> {
    let d = l as u32;
    let bytes: [u8; 4] = unsafe {
        transmute(d.to_le()) // or .to_be()
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

fn read_len()  -> std::result::Result<usize, std::io::Error> {
    let mut bytes = [0u8; 4];
    
    std::io::stdin().read_exact(&mut bytes)?;
    
    let l: u32 = unsafe {
        transmute(bytes)
    };
    
    Ok(l as usize)
}

fn read_data(len: usize, data: mut String) -> std::result::Result<usize, std::io::Error> {
    let len = std::io::stdin().read_to_string(&mut data)?;
    
    Ok(len)
}


fn main() {
    let mut result = ProcessResult::Ok;
    let mut len = 0;
    
    match read_len() {
        Ok(l) => len = l,
        Err(e) => result = ProcessResult::Err,
    }
    
    let mut data = vec![0; len];
    
    send_message("", "", result, &format!("{}", len));
}

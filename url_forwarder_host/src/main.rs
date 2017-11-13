use std::io::Read;
use std::mem::transmute;
use std::io::{self, Write};

fn main() {
    let input: Option<i32> = std::io::stdin()
    .bytes() 
    .next()
    .and_then(|result| result.ok())
    .map(|byte| byte as i32);

    
    let bytes: [u8; 4] = unsafe { transmute(5u32.to_be()) };
    
    
    io::stdout().write(&bytes);
    io::stdout().write(b"hello");
}

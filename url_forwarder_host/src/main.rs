#[macro_use]
extern crate serde_json;

mod browser {

    pub struct Call {
        pub url: String,
        pub target: String,
        pub args: String,
    }

    pub struct Error {
        pub error: String,
        pub is_error: bool,
    }

    pub struct Message {
        pub call: Call,
        pub err: Error,
    }

    pub mod input {
        extern crate serde_json;

        use std;
        use std::io::Read;
        use std::mem::transmute;

        fn read_size() -> std::result::Result<usize, std::io::Error> {
            let mut bytes = [0u8; 4];
            std::io::stdin().read_exact(&mut bytes)?;
            let l: u32 = unsafe {
                transmute(bytes)
            };
            Ok(l as usize)
        }

        fn read_bytes() -> Result<Vec<u8>, std::io::Error> {
            let size = read_size()?;

            let mut data = vec![0u8; size];
            std::io::stdin().read_exact(&mut data)?;
            
            Ok(data)
        }

        fn read_text() -> String {
            let error: String = String::from("{\"error\": \"IO error\"}");

            if let Ok(bytes) = read_bytes() {
                String::from_utf8(bytes).unwrap_or(error)
            } else {
                error
            }
        }

        pub fn read() -> super::Message {
            let text = read_text();
            let mut msg = super::Message{
                call: super::Call {
                    url: String::new(),
                    target: String::new(),
                    args: String::new(),
                },
                err: super::Error {
                    error: String::new(),
                    is_error: false,
                },
            };
            
            if let Ok(m) = serde_json::from_str(&text) {
                let json: serde_json::Value = m;
                let url = String::from(json["url"].as_str().unwrap_or(&""));
                let target = String::from(json["target"].as_str().unwrap_or(&""));
                let args = String::from(json["args"].as_str().unwrap_or(&""));
                let err = String::from(json["error"].as_str().unwrap_or(&""));

                if err.len() > 0 {
                    msg.err.error = err;
                    msg.err.is_error = true;
                } else {
                    msg.call.url = url;
                    msg.call.target = target;
                    msg.call.args = args;
                }
            } else {
                msg.err.is_error = true;
                msg.err.error = String::from("JSON parsing error");
            }

            msg
        }
    }

    pub mod output {
        extern crate serde_json;
    
        use std;
        use std::io::Write;
        use std::mem::transmute;
        
        fn write_size(l: usize) -> std::result::Result<usize, std::io::Error> {
            let d = l as u32;
            let bytes: [u8; 4] = unsafe {
                transmute(d)
            };
            
            std::io::stdout().write(&bytes)
        }

        fn write_message(msg: &str) -> std::result::Result<usize, std::io::Error> {
            write_size(msg.len())?;
            std::io::stdout().write(String::from(msg).as_bytes())
        }

        pub fn send(msg: super::Error) {
            let json: serde_json::Value = json!({
                "error": msg.is_error,
                "response": msg.error
            });

            match write_message(&json.to_string()) {
                Ok(_) => {},
                Err(e) => eprintln!("{:?}", e),
            }
        }
    }
}

use std::process::Command;

fn start_process(call: browser::Call) -> String {
    match Command::new(call.target.clone()).arg(call.args.clone()).arg(call.url).spawn() {
        Ok(_) => String::from(call.target),
        Err(e) => String::from(format!("{} - {} - {:?}", call.target, call.args, e)),
    }
}

fn main() {
    let msg = browser::input::read();
    let call = msg.call;
    let mut err = msg.err;

    if !err.is_error {
        err.error = start_process(call);
    }

    browser::output::send(err);
}

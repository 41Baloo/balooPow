use wasm_bindgen::prelude::*;
use sha2::{Sha256, Digest};
use serde::Serialize;
use serde_wasm_bindgen::to_value;

#[derive(Serialize)]
struct Result {
    solution: String,
    access: String,
}

#[inline(always)]
fn get_string_by_index(index: usize, length: usize) -> String {
    let chars = b"0123456789abcdef";
    let mut res = vec![0u8; length];
    let mut idx = index;
    for i in (0..length).rev() {
        res[i] = chars[idx & 0xF];
        idx >>= 4;
    }
    unsafe { String::from_utf8_unchecked(res) }
}

#[wasm_bindgen]
pub fn find_solution(
    public_salt: &str,
    challenge: &str,
    start: usize,
    end: usize,
    numeric: bool,
    difficulty: usize,
) -> JsValue {
    let public_salt_bytes = public_salt.as_bytes();
    let challenge_bytes = hex::decode(challenge).unwrap();
    let public_salt_len = public_salt_bytes.len();

    let mut result = Result {
        solution: String::new(),
        access: String::new(),
    };

    let mut precomputed_context = Sha256::new();
    precomputed_context.update(public_salt_bytes);

    if numeric {
        let mut input = Vec::with_capacity(public_salt_len + 20);
        let mut buffer = itoa::Buffer::new();

        for i in start..=end {
            let num_str = buffer.format(i);
            let num_bytes = num_str.as_bytes();

            input.truncate(public_salt_len);
            input.extend_from_slice(num_bytes);

            let mut context = precomputed_context.clone();
            unsafe {
                let input_ptr = num_bytes.as_ptr();
                let len = num_bytes.len();
                context.update(std::slice::from_raw_parts(input_ptr, len));
            }
            let hash = context.finalize();

            if hash.as_slice() == challenge_bytes.as_slice() {
                let mut access_context = Sha256::new();
                unsafe {
                    let input_ptr = num_bytes.as_ptr();
                    let len = num_bytes.len();
                    access_context.update(std::slice::from_raw_parts(input_ptr, len));
                    access_context.update(public_salt_bytes);
                }
                let access_hash = access_context.finalize();

                result.solution = num_str.to_string();
                result.access = hex::encode(access_hash);
                break;
            }
        }
    } else {
        let mut input = Vec::with_capacity(public_salt_len + difficulty);

        for i in start..=end {
            let current = get_string_by_index(i, difficulty);
            let current_bytes = current.as_bytes();

            input.truncate(public_salt_len);
            input.extend_from_slice(current_bytes);

            let mut context = precomputed_context.clone();
            unsafe {
                let input_ptr = current_bytes.as_ptr();
                let len = current_bytes.len();
                context.update(std::slice::from_raw_parts(input_ptr, len));
            }
            let hash = context.finalize();

            if hash.as_slice() == challenge_bytes.as_slice() {
                let mut access_context = Sha256::new();
                unsafe {
                    let input_ptr = current_bytes.as_ptr();
                    let len = current_bytes.len();
                    access_context.update(std::slice::from_raw_parts(input_ptr, len));
                    access_context.update(public_salt_bytes);
                }
                let access_hash = access_context.finalize();

                result.solution = current;
                result.access = hex::encode(access_hash);
                break;
            }
        }
    }

    to_value(&result).unwrap()
}

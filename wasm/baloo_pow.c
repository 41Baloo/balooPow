#include <string.h>
#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include "tinycrypt/sha256.h"

void sha256(const char *input, size_t input_len, char *output) {
    uint8_t hash[32];
    struct tc_sha256_state_struct s;
    tc_sha256_init(&s);
    tc_sha256_update(&s, (const uint8_t *)input, input_len);
    tc_sha256_final(hash, &s);

    for (int i = 0; i < 32; i++) {
        sprintf(output + (i * 2), "%02x", hash[i]);
    }
}

int int_to_str(int num, char *str) {
    char temp[12];
    int i = 0, j;
    if (num == 0) {
        str[i++] = '0';
    } else {
        while (num > 0) {
            temp[i++] = '0' + (num % 10);
            num /= 10;
        }
    }
    for (j = 0; j < i; j++) {
        str[j] = temp[i - j - 1];
    }
    return i;
}

int brute_force(const char *publicSalt, const char *challenge, int start, int end, int numeric, int difficulty, char *solution) {
    char hash[65];
    hash[64] = 0;
    char input[128];
    size_t publicSalt_len = strlen(publicSalt);

    if (numeric) {
        memcpy(input, publicSalt, publicSalt_len);

        for (int i = start; i <= end; i++) {
            int num_len = int_to_str(i, input + publicSalt_len);
            sha256(input, publicSalt_len + num_len, hash);
            if (strcmp(hash, challenge) == 0) {
                sprintf(solution, "%d", i);
                return 1;
            }
        }
    } else {
        return 0; // i will likely never implement this
    }

    return 0;
}

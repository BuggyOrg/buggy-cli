

(io/stdout (translator/number_to_string (functional/apply (lambda [x] (math/add x 1)) (translator/string_to_number (io/stdin)))))


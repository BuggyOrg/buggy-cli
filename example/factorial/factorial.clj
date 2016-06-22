(import all)
(defco factorial (n)
  (if (< n 1)
    1
    (math/multiply n (factorial (+ n -1)))))

(io/stdout (translator/number_to_string (factorial (translator/string_to_number (io/stdin)))))
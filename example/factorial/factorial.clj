(import all)
(defco fac (n)
  (if (< n 1)
    1
    (math/multiply n (fac (+ n -1)))))

(io/stdout (translator/number_to_string (fac (translator/string_to_number (io/stdin)))))

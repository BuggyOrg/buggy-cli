(import all)
(defco fac (n)
  (logic/mux
    1
    (math/multiply n (fac (+ n -1)))
    (< n 1)))

(io/stdout (translator/number_to_string (fac (translator/string_to_number (io/stdin)))))

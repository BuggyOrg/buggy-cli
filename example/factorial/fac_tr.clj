(import all)

(defco fac_tr [n acc]
  (if (< 1 n)
    (fac_tr (- n 1) (* acc n))
    acc))

(defco fac [n] (fac_tr n 1))

(io/stdout (translator/number_to_string (fac (translator/string_to_number (io/stdin)))))
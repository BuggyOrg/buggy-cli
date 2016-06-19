(defco factorial (n)
  (logic/if (math/less n 1)
    1
    (math/multiply n (factorial (math/add n -1)))))

(io/stdout (translator/number_to_string (factorial (translator/string_to_number (io/stdin)))))
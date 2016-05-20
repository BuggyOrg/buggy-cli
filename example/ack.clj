(defco ack (m n)
  (:result (logic/mux
    (math/add n 1) ; m = 0
    (logic/mux
      (ack (math/add m -1) 1) ; m > 0, n = 0
      (ack (math/add m -1) (ack m (math/add n -1))) ; m > 0, n > 0
      (logic/equal n 0))
    (logic/equal m 0))))


(io/stdout (translator/number_to_string (ack 3 (translator/string_to_number (io/stdin)))))

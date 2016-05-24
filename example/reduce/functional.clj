

(defco fold [list fn init]
  (logic/mux
    list
    (functional/apply (functional/partial fn (array/first list)) (fold (array/rest list) fn init))
    (array/empty list)))

(defco filter [list fn]
  (fold list (functional/partial (lambda (fn acc cur)
    (logic/mux
      (array/append acc cur)
      acc
      (functional/apply fn cur))) fn) []))

(io/stdout (translator/array_to_string (filter (translator/string_to_array (io/stdin)) (lambda (n) (math/less n 10)))))

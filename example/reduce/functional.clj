

(defco foldl [list fn init]
  (logic/if (array/empty list)
    init
    (foldl (array/rest list) fn (functional/apply (functional/partial 1 fn (array/first list)) init))
  ))

(defco filter [list fn]
  (foldl list (functional/partial 0 (lambda (fn acc cur)
    (logic/mux
      (array/append acc cur)
      acc
      (functional/apply fn cur))) fn) []))

(io/stdout (translator/array_to_string (filter (translator/string_to_array (io/stdin)) (lambda (n) (math/less n 10)))))

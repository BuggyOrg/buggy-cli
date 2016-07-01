(import all)

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

(defco partition-left [list p]
  (filter list (functional/partial 0 (lambda (n m) (math/less m n)) p)))

(defco partition-right [list p]
  (filter list (functional/partial 0 (lambda (n m) (math/less n m)) p)))

(defco quicksort [list]
  (if (array/empty list)
    list
    (array/concat
      (array/append (quicksort (partition-left (array/rest list) (array/first list))) (array/first list))
      (quicksort (partition-right (array/rest list) (array/first list))))))

(io/stdout (translator/array_to_string (quicksort (translator/string_to_array (io/stdin)))))

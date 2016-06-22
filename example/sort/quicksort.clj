(import all)

(defco fold [list fn init]
  (if (array/empty list)
    init
    (functional/apply (functional/partial 1 fn (array/first list)) (fold (array/rest list) fn init))))

(defco filter [list fn]
  (fold list (functional/partial 0 (lambda (fn acc cur)
    (if (functional/apply fn cur)
      (array/prepend acc cur)
      acc)) fn) []))

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

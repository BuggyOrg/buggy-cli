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

(defco min [list]
  (if (array/empty list)
    100000000000
    (if (math/less (array/first list) (min (array/rest list)))
      (array/first list)
      (min (array/rest list)))))

(defco selectionsort [list]
  (if (array/empty list)
    list
    (let [m (min list)]
      (array/prepend (selectionsort (filter list 
        (functional/partial 0 (lambda (x y) (logic/not (logic/equal x y))) m))) m))))

(io/stdout (translator/array_to_string (selectionsort (translator/string_to_array (io/stdin)))))

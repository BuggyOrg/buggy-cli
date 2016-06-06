

(defco fold [list fn init]
  (logic/mux
    init
    (functional/apply (functional/partial 1 fn (array/first list)) (fold (array/rest list) fn init))
    (array/empty list)))

(defco filter [list fn]
  (fold list (functional/partial 0 (lambda (fn acc cur)
    (logic/mux
      (array/prepend acc cur)
      acc
      (functional/apply fn cur))) fn) []))

(defco min [list]
  (logic/mux
    100000000000
    (logic/mux
      (array/first list)
      (min (array/rest list))
      (math/less (array/first list) (min (array/rest list))))
    (array/empty list)))

(defco selectionsort [list]
  (logic/mux
    list
    (let [m (min list)]
      (array/prepend (selectionsort (filter list 
        (functional/partial 0 (lambda (x y) (logic/not (logic/equal x y))) m))) m))
    (array/empty list)))

(io/stdout (translator/array_to_string (selectionsort (translator/string_to_array (io/stdin)))))

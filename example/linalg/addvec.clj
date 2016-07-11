(import all)

(defco foldl [list fn init]
  (logic/if (array/empty list)
    init
    (foldl (array/rest list) fn (functional/apply (functional/partial 1 fn (array/first list)) init))
  ))

(defco map2 [list fn]
  (foldl list
    (partial 2 (lambda [acc cur fn2] (array/append acc (functional/apply fn2 cur))) fn)
    []))

(defco zipWith [fn list1 list2]
  (if (empty list1)
    list1
    (if (empty list2)
      list2
      (array/prepend (zipWith fn (array/rest list1) (array/rest list2))
        (functional/apply (functional/partial 0 fn (array/first list1)) (array/first list2))))))

(let [list (translator/string_to_array (io/stdin))]
  (io/stdout (translator/array_to_string (zipWith (lambda (n m) (math/add n m)) list list)))
)

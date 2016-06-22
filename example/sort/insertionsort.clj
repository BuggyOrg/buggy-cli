(import all)

(defco fold [list fn init]
  (if (array/empty list)
    init
    (functional/apply (functional/partial 1 fn (array/first list)) (fold (array/rest list) fn init))))


(defco bubble-n-up [list i]
  (if (logic/and (math/less (array/at i list) (array/at (+ i -1) list)) (logic/not (math/less i 1)))
    (bubble-n-up (array/swap list i (+ i -1)) (+ i -1))
    list))

(defco bubble-up [list] ; takes the last element and swaps it until it is in the correct position
  (bubble-n-up list (+ (array/length list) -1)))

(defco insertionsort [list]
  (fold list 
    (lambda [acc cur] (bubble-up (array/append acc cur))) []))

(io/stdout (translator/array_to_string (insertionsort (translator/string_to_array (io/stdin)))))

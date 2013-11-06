function A = Coord2Mat( B, n )

A = zeros(n, n);
[rows, cols] = size(B);

for i=1:rows
    y = B(i, 1) + 1;
    x = B(i, 2) + 1;
    A(y, x) = B(i, 3);
end

end
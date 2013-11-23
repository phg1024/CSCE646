#pragma once

namespace Utils 
{
template <typename T>
T clamp(T val, T low, T high)
{
    return max(min(val, high), low);
}

template <typename T>
T interpolate(T x1, T x2, float t) {
    return x1 * t + x2 * (1.0-t);
}
}

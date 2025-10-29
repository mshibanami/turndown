```swift
import Foundation

struct User: Codable, CustomStringConvertible {
    let id: UUID
    var name: String
    var score: Int = 0

    mutating func add(points: Int) {
        score += points
    }

    var description: String {
        "User(id: \\(id.uuidString), name: \\(name), score: \\(score))"
    }
}
```

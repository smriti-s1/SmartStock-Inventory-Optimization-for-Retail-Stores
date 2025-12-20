import gc

class Demo:
    def __init__(self, name):
        self.name = name

# Create objects
obj1 = Demo("Object 1")
obj2 = Demo("Object 2")

# Create a circular reference
obj1.ref = obj2
obj2.ref = obj1

# Delete references
del obj1
del obj2

# Force garbage collection
collected_objects = gc.collect()

print("Number of unreachable objects collected:", collected_objects)



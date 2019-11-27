""" Appends a new puzzle to puzzles.json """

import json
import os

def parse(s):
	rows = s.split(";")
	newRows = []
	for row in rows:
		items = [int(n) for n in row.split()]
		assert len(items) == 9
		newRows.append(items)
	assert len(newRows) == 9
	return newRows


if __name__ == "__main__":
	# get json data
	dirname = os.path.dirname(__file__)
	filename = os.path.join(dirname, '../puzzles.json')	
	with open(filename) as file:
		data = json.load(file)

	s = input("Enter Puzzle, white space is delimiter for tile, ; is delimter for row, 0 is an empty space.\n> ")
	newPuzzle = parse(s)

	data["puzzles"].append(newPuzzle)

	with open(filename, "w") as file:
		json.dump(data, file)



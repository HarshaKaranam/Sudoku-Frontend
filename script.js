const sudokuBoard = document.getElementById('sudoku-board');
const startButton = document.getElementById('start-game');
const pauseButton = document.getElementById('pause-game');
const notesToggleButton = document.getElementById('notes-toggle');
const notesStatusText = document.querySelector('#notes-toggle .notes-status');
const timerDisplay = document.getElementById('timer');
const difficultySelect = document.getElementById('difficulty');
const eraseButton = document.getElementById('erase-button');
const paintButton = document.getElementById('paint-button');
const colorPalette = document.getElementById('color-palette');

const initialBoardState = []; // To store the initial state of the board
document.getElementById('reset-board').addEventListener('click', () => {
    resetBoard();
    moveHistory = [];
    clearHighlights();
    clearSelectedCell();
});
function resetBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        const initialValue = initialBoardState[index] || '';
        cell.textContent = initialValue;
        cell.classList.remove('user-entered'); // Remove user styling
    });
}

// Store the initial board state at the start of the game
function storeInitialBoardState() {
    const cells = document.querySelectorAll('.cell');
    initialBoardState.length = 0; // Clear any previous state
    cells.forEach(cell => {
        initialBoardState.push(cell.textContent || '');
    });
}

document.getElementById('undo-move').addEventListener('click', () => {
    undoMove();
})

const moveHistory = []; // Stack to track user moves

function trackMove(cell, previousValue, newValue) {
    moveHistory.push({ cell, previousValue, newValue });
}

function undoMove() {
    if (moveHistory.length === 0) {
        showNotification('No moves to undo!');
        return;
    }

    const lastMove = moveHistory.pop();
    const cell = lastMove.cell;
    const previousValue = lastMove.previousValue;
    clearSelectedCell();
    selectedCell = cell;
    cell.classList.add('selected');

    if (cell.classList.contains('note-mode')) {
        // Handle undo for notes mode
        selectedCell.textContent = '';
        for (let i = 0; i < previousValue.length; i++) {
            const note = document.createElement('div');
            note.textContent = previousValue[i];
            note.classList.add(`note-${previousValue[i]}`);
            cell.appendChild(note);; // Access each character using index
        }
    } else {
        // Handle undo for regular cells
        if (previousValue === '') {
            cell.textContent = ''; // Clear the cell if previous value was empty
            cell.classList.remove('user-entered');
        } else {
            cell.textContent = previousValue; // Restore the previous value
            cell.classList.add('user-entered');
        }
    }

    clearHighlights();
    if (cell.textContent) {
        highlightMatchingNumbers(cell.textContent); // Highlight updated numbers
    }
}

function handleCellInput(cell, value) {
    const previousValue = cell.textContent || '';
    console.log(cell, previousValue, value);
    if (previousValue !== value) {
        trackMove(cell, previousValue, value); // Track this move
    } else {
        trackMove(cell, previousValue, '');
    }
}


function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.classList.remove('show', 'fade-out');
        }, 500);
    }, 2000);
}

//const hamburgerMenu = document.getElementById('hamburger-menu');
//const sidePanel = document.getElementById('side-panel');
//const closePanelButton = document.getElementById('close-panel');

const challengeFriendButton = document.getElementById('challenge-friend');
const modal = document.getElementById('challenge-modal');
const closeModal = document.querySelector('.close');
const generateCodeButton = document.getElementById('generate-code');
const searchGameButton = document.getElementById('search-game');
const gameResultDiv = document.getElementById('game-result');
const startChallengedGameButton = document.getElementById('start-challenged-game');
const challengeDifficultySelect = document.getElementById('challenge-difficulty');
const searchInput = document.getElementById('search-code');
const roomCodeDiv = document.getElementById('room-code');

const BASE_URL = 'https://sudoku-backend-wm0m.onrender.com'; //'http://172.20.10.2:3000'; // Replace with your server's IP
let room_Code = '';

function updateHeader(mode) {
    const header = document.getElementById('game-mode-header');
    header.textContent = mode === 'solo' ? 'Sudoku - SOLO' : 'Sudoku - PARTY';
}

async function generateUniqueRoomCode() {
    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        console.log(code);
        return code;
    };

    const difficulty = challengeDifficultySelect.value;
    const puzzleData = await fetchPuzzleData(difficulty);
    let gameCode = puzzleData.id;
    puzzleBackup = convertToGrid(puzzleData.puzzle);
    currentSolution = convertToGrid(puzzleData.solution);
    let userName = localStorage.getItem('sudokuUserName');
    console.log(userName);

    let unique = false;
    let roomCode = '';
    while (!unique) {
        roomCode = generateCode();
        room_Code = roomCode
        const response = await fetch(`${BASE_URL}/search-room/${roomCode}`);
        const result = await response.json();
        unique = !result.exists;
    }
    try {
        const response = await fetch(`${BASE_URL}/generate-room`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roomCode, gameCode, userName }),
        });
        const data = await response.json();
        console.log(data);
        if (response.ok) {
            console.log('Room created:', data);
            //return data; // Return the generated room data
        } else {
            console.error('Error generating room:', data.error);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
    return roomCode;
}


async function fetchPuzzleData(difficulty) {
    const response = await fetch(`${BASE_URL}/puzzle/${difficulty}`);
    const puzzleData = await response.json();
    console.log(puzzleData)
    return puzzleData;
}

async function fetchLeaderboard(puzzleId) {
    const response = await fetch(`${BASE_URL}/leaderboard/${puzzleId}`);
    const leaderboard = await response.json();
    console.log(leaderboard); // Display leaderboard on your website
}

async function fetchPuzzleDataById(id) {
    const response = await fetch(`${BASE_URL}/puzzle/id/${id}`);
    const puzzleData = await response.json();
    console.log(puzzleData);
    return puzzleData;
}

fetchPuzzleDataById('bc04')


function convertToGrid(input) {
    if (input.length !== 81) {
        throw new Error("Input must be exactly 81 characters long");
    }

    const grid = [];
    for (let i = 0; i < 81; i += 9) {
        // Convert each segment of 9 characters into an array
        const row = input
            .slice(i, i + 9) // Get a substring of 9 characters
            .split('') // Split it into an array of characters
            .map(char => (char === '.' ? 0 : parseInt(char, 10))); // Replace '.' with 0 and parse numbers
        grid.push(row);
    }

    return grid;
}


// Challenge Friend Modal logic
challengeFriendButton.addEventListener('click', () => {
    modal.style.display = "block";
});

closeModal.addEventListener('click', () => {
    modal.style.display = "none";
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// Generate game code
generateCodeButton.addEventListener('click', async () => {
    //const difficulty = challengeDifficultySelect.value;
    //const puzzleData = await fetchPuzzleData(difficulty);
    const roomCode = await generateUniqueRoomCode();
    //puzzleBackup = convertToGrid(puzzleData.puzzle);
    gameResultDiv.innerText = `Generated Game Code: ${roomCode}`;
    document.getElementById('room-code-value').textContent = roomCode;
    //gameResultDiv.innerText = `Generated Game Code: ${puzzleData.id}`;
    startChallengedGameButton.disabled = false; // Enable start button

});

searchGameButton.addEventListener('click', async () => {
    const code = searchInput.value.trim(); // Room code entered by the user
    if (code !== '') {
        try {
            // Fetch the game_code using the room code
            const response = await fetch(`${BASE_URL}/game-code/${code}`);
            if (response.ok) {
                const { gameCode } = await response.json(); // Extract game_code from response
                document.getElementById('room-code-value').textContent = code;

                // Fetch puzzle data using the game_code
                const puzzleData = await fetchPuzzleDataById(gameCode);
                const roomCode = code;
                room_Code = code;

            
                // Puzzle found: Convert to grid and enable the start button
                puzzleBackup = convertToGrid(puzzleData.puzzle);
                currentSolution = convertToGrid(puzzleData.solution);
                gameResultDiv.innerText = `Room found!`;
                startChallengedGameButton.disabled = false;
                let userName = localStorage.getItem('sudokuUserName');
                try {
                    console.log(roomCode);
                    const response = await fetch(`${BASE_URL}/generate-room`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ roomCode, gameCode, userName }),
                    });
                    const data = await response.json();
                    console.log(data);
                    if (response.ok) {
                        console.log('Room created:', data);
                        //return data; // Return the generated room data
                    } else {
                        console.error('Error generating room:', data.error);
                    }
                } catch (error) {
                    console.error('Network error:', error);
                }

            } else if (response.status === 404) {
                // Room code not found
                gameResultDiv.innerText = 'Room code not found.';
                startChallengedGameButton.disabled = true;
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error searching for game:', error);
            gameResultDiv.innerText = 'An error occurred. Please try again.';
            startChallengedGameButton.disabled = true;
        }
    } else {
        gameResultDiv.innerText = 'Please enter a valid room code.';
        startChallengedGameButton.disabled = true;
    }
});



/*/ Search for game by code
searchGameButton.addEventListener('click', async () => {
    const code = searchInput.value.trim();
    if (code !== '') {  
        try {
            //const response = await fetch(`${BASE_URL}/search-room/${roomCode}`);
            //const result = await response.json();
            //unique = !result.exists;
            //const puzzleData = await fetchPuzzleDataById(code);

            if (puzzleData.id !== '0000') {
                // Puzzle found: Convert to grid and enable the start button
                puzzleBackup = convertToGrid(puzzleData.puzzle);
                gameResultDiv.innerText = `Game found! Code: ${puzzleData.id}`;
                startChallengedGameButton.disabled = false;
            } else {
                // Puzzle not found: Display message and disable start button
                gameResultDiv.innerText = puzzleData.message;
                startChallengedGameButton.disabled = true;
            }
        } catch (error) {
            console.error('Error fetching puzzle:', error);
            gameResultDiv.innerText = 'An error occurred. Please try again.';
            startChallengedGameButton.disabled = true;
        }
    } else {
        gameResultDiv.innerText = 'Please enter valid game code.';
        startChallengedGameButton.disabled = true;
    }
});
*/

updateHeader('solo');

// Start game with challenged or searched puzzle
startChallengedGameButton.addEventListener('click', () => {
    modal.style.display = "none";
    renderBoard(puzzleBackup);
    resetTimer();
    startTimer();
    saveUserInputs();
    updateHeader('multiplayer');
    storeInitialBoardState();
    scoreboard.classList.remove('hidden');
    roomCodeDiv.classList.remove('hidden');
    pauseButton.disabled = false; // Enable pause button
    pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    isPaused = false;
});

/*
function getRandomPuzzleWithCode(difficulty) {
    const puzzleList = puzzles[difficulty];
    const randomIndex = Math.floor(Math.random() * puzzleList.length);
    return puzzleList[randomIndex];
}


// Open side panel
hamburgerMenu.addEventListener('click', () => {
    sidePanel.classList.toggle('show');
});


// Close side panel
closePanelButton.addEventListener('click', () => {
    sidePanel.classList.remove('show');
});

// Optional: Close the side panel when clicking outside
document.addEventListener('click', (event) => {
    if (!sidePanel.contains(event.target) && !hamburgerMenu.contains(event.target)) {
        sidePanel.classList.remove('show');
    }
});

document.getElementById('solver').addEventListener('click', () => {
    window.location.href = 'solver.html'; // Redirect to Solver page
});

document.getElementById('learn').addEventListener('click', () => {
    window.location.href = 'learn.html'; // Redirect to Learn page
});

*/

function promptUserForName() {
    const name = prompt("Welcome to Sudoku! Please enter your name:");
    if (name && name.trim()) {
        return name.trim(); // Ensure name is trimmed of extra spaces
    }
    return null;
}

function initializeUser() {
    // Check if the user's name already exists in localStorage
    let userName = localStorage.getItem('sudokuUserName');

    if (!userName) {
        // Prompt the user for their name on the first visit
        userName = promptUserForName();

        if (userName) {
            // Store the name in localStorage
            localStorage.setItem('sudokuUserName', userName);
        } else {
            alert("You need to enter your name to continue.");
            // Reload the page to re-prompt
            location.reload();
        }
    }

    // Return the user name for further usage
    return userName;
}

// Initialize the user when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const userName = initializeUser();
    console.log('User Name:', userName);
});

let puzzles = {};
let currentSolution = [];
let puzzleBackup;
let userInputs = []; // Store user inputs when the game is paused
let timer;
let time = 0;
let isPaused = false;
let isNotesMode = false;
let selectedCell = null;
let selectedColor = '#9d9d9d00'; // Default color for notes

// Load puzzles from sudoku_puzzles.json
fetch('puzzles_with_codes.json')
    .then(response => response.json())
    .then(data => {
        puzzles = data;
        renderEmptyBoard();
    });


// Toggle Notes mode on and off
notesToggleButton.addEventListener('click', () => {
    isNotesMode = !isNotesMode;
    notesToggleButton.classList.toggle('active', isNotesMode);
    notesStatusText.textContent = isNotesMode ? 'ON' : 'OFF'; // Update the text based on Notes mode
});

// Function to handle cell selection and highlighting
function addCellSelectionListeners() {
    const cells = sudokuBoard.getElementsByClassName('cell');
    for (let cell of cells) {
        cell.addEventListener('click', () => {
            clearHighlights();
            if (selectedCell) {
                selectedCell.classList.remove('selected');
            }
            selectedCell = cell;
            selectedCell.classList.add('selected');
            const cellValue = cell.textContent.trim();
            if (cellValue) {
                highlightMatchingNumbers(cellValue);
            }
        });
    }
}


// Highlight all cells containing the same number as the selected cell
function highlightMatchingNumbers(value) {
    clearHighlights();
    if (!value) return;
    const cells = sudokuBoard.getElementsByClassName('cell');
    for (let cell of cells) {
        if (cell.textContent.trim() === value && cell !== selectedCell) {
            cell.classList.add('highlight');
        }
        // Highlight matching notes in note-mode cells
        if (cell.classList.contains('note-mode')) {
            const notes = cell.querySelectorAll(`.note-${value}`);
            notes.forEach(note => {
                note.classList.add('highlight-note'); // Add highlight class to matching notes
            });
        }
    }
}

// Clear highlights from all cells
function clearHighlights() {
    const cells = sudokuBoard.getElementsByClassName('highlight');
    while (cells.length) {
        cells[0].classList.remove('highlight');
    }
    // Clear highlighted notes in note-mode cells
    const highlightedNotes = sudokuBoard.getElementsByClassName('highlight-note');
    while (highlightedNotes.length) {
        highlightedNotes[0].classList.remove('highlight-note');
    }
}

// Event listener for number pad clicks
document.getElementById('number-pad').addEventListener('click', (event) => {
    if (!selectedCell && event.target.classList.contains('number-btn')) {
        const number = event.target.getAttribute('data-value');
        highlightMatchingNumbers(number);
    } else if (selectedCell && event.target.classList.contains('number-btn')) {
        const number = event.target.getAttribute('data-value');
        updateCellValue(number);
    }
});

document.addEventListener('keydown', (event) => {
    if (event.code === "Space") {
        isNotesMode = !isNotesMode;
        notesToggleButton.classList.toggle('active', isNotesMode);
        notesStatusText.textContent = isNotesMode ? 'ON' : 'OFF';
    }
});

// Event listener for keyboard number input
document.addEventListener('keydown', (event) => {
    if (!selectedCell && event.key >= '1' && event.key <= '9') {
        highlightMatchingNumbers(event.key);
    } else if (selectedCell && event.key >= '1' && event.key <= '9') {
        updateCellValue(event.key);
    } else if (event.key === 'Delete' && selectedCell && !selectedCell.dataset.prefilled) {
        selectedCell.textContent = ''; // Clear the cell's content
        selectedCell.classList.remove('user-entered'); // Remove user-entered style
    }
});

// Update cell value in regular or Notes mode
function updateCellValue(value) {
    if (!selectedCell.dataset.prefilled) {
        if (isNotesMode) {
            handleCellInput(selectedCell,value);
            toggleNoteInCell(selectedCell, value); // Toggle note in Notes mode
        } else {
            handleCellInput(selectedCell,value);
            toggleRegularInput(selectedCell, value); // Handle regular input
            checkForCompletion();
        }
    }
}

// Toggle regular input: Adds or removes the value in the cell
function toggleRegularInput(cell, value) {
    if (cell.classList.contains('note-mode')) {
        // If the cell is in Notes mode, clear notes and switch to regular mode
        cell.classList.remove('note-mode');
        cell.innerHTML = '';
    }

    if (cell.textContent === value) {
        // If the same value exists, clear it
        cell.textContent = '';
        cell.classList.remove('user-entered');
    } else {
        // Otherwise, set the new value
        cell.textContent = value;
        cell.classList.add('user-entered');
        removeNotesFromRelatedCells(cell, value);
    }
    userInputs[cell.dataset.row][cell.dataset.col] = cell.textContent.trim();
    clearHighlights();
    highlightMatchingNumbers(cell.textContent);
}

// Function to check if the board is complete and matches the solution
function checkForCompletion() {
    const cells = document.querySelectorAll('.cell');
    const currentBoard = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Fill the currentBoard array with the values from the Sudoku board
    cells.forEach((cell) => {
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        currentBoard[row][col] = cell.textContent ? parseInt(cell.textContent, 10) : 0;
    });

    // Check if all cells are filled
    const isBoardComplete = currentBoard.flat().every(value => value !== 0);

    if (isBoardComplete) {
        if (compareBoards(currentBoard, currentSolution)) {
            // Pause the timer
            stopTimer();

            // Display a congratulatory message with the elapsed time
            const elapsedTime = formatTime(time);
            showCompletionModal(`You've completed the puzzle in ${elapsedTime}.`);

            // Lock the board to prevent further edits
            lockBoard();
        } else {
            showCompletionModal("The board is fully filled, but the solution is incorrect. Keep trying!");
        }
    }
}

// Helper function to compare the current board with the solution
function compareBoards(board, solution) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== solution[row][col]) {
                return false;
            }
        }
    }
    return true;
}

function lockBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.add('locked'); // Add a class for locked styling
        cell.style.pointerEvents = 'none'; // Disable pointer events
    });
}


// Format time for display
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
}

function showCompletionModal(message) {
    const completionModal = document.getElementById('completion-modal');
    const completionMessage = document.getElementById('completion-message');
    const closeCompletionModalButton = document.getElementById('close-completion-modal');

    // Set the message and show the modal
    completionMessage.textContent = message;
    completionModal.classList.add('show');

    // Close modal on button click
    closeCompletionModalButton.addEventListener('click', () => {
        completionModal.classList.remove('show');
    });
}

// Toggle note in cell: Adds or removes the note in Notes mode
function toggleNoteInCell(cell, value) {
    if (!cell.classList.contains('note-mode')) {
        cell.classList.add('note-mode');
        cell.innerHTML = ''; // Clear any regular input
    }

    // Check if the note already exists in the cell
    const existingNote = cell.querySelector(`.note-${value}`);
    if (existingNote) {
        // If the note exists, remove it
        cell.removeChild(existingNote);
        if (!cell.querySelector('.note-mode div')) {
            // If no notes remain, remove note-mode styling
            cell.classList.remove('note-mode');
        }
    } else {
        // If the note does not exist, add it
        const note = document.createElement('div');
        note.textContent = value;
        note.classList.add(`note-${value}`);
        note.style.backgroundColor = selectedColor;
        cell.appendChild(note);
    }
    clearHighlights();
}

// Remove notes of a specific number from the row, column, and 3x3 grid
function removeNotesFromRelatedCells(cell, value) {
    const rowIndex = parseInt(cell.dataset.row, 10);
    const colIndex = parseInt(cell.dataset.col, 10);

    const cells = document.querySelectorAll('.cell');

    // Iterate through all cells
    cells.forEach((targetCell) => {
        const targetRowIndex = parseInt(targetCell.dataset.row, 10);
        const targetColIndex = parseInt(targetCell.dataset.col, 10);

        // Same row, same column, or same 3x3 grid
        if (
            targetRowIndex === rowIndex || // Same row
            targetColIndex === colIndex || // Same column
            isSameGrid(rowIndex, colIndex, targetRowIndex, targetColIndex) // Same 3x3 grid
        ) {
            // Remove the note if the cell is in note mode
            if (targetCell.classList.contains('note-mode')) {
                const noteToRemove = targetCell.querySelector(`.note-${value}`);
                if (noteToRemove) {
                    targetCell.removeChild(noteToRemove);
                }

                // If no notes remain, remove the note-mode class
                if (!targetCell.querySelector('.note-mode div')) {
                    targetCell.classList.remove('note-mode');
                }
            }
        }
    });
}

// Helper function to check if two cells are in the same 3x3 grid
function isSameGrid(row1, col1, row2, col2) {
    const gridRow1 = Math.floor(row1 / 3);
    const gridCol1 = Math.floor(col1 / 3);
    const gridRow2 = Math.floor(row2 / 3);
    const gridCol2 = Math.floor(col2 / 3);

    return gridRow1 === gridRow2 && gridCol1 === gridCol2;
}

// Add a note to the selected cell
function addNoteToCell(cell, value) {
    if (!cell.classList.contains('note-mode')) {
        cell.classList.add('note-mode');
        cell.innerHTML = ''; // Clear any regular input
    }
    // Add a note in the appropriate position if not already present
    if (!cell.querySelector(`.note-${value}`)) {
        const note = document.createElement('div');
        note.textContent = value;
        note.classList.add(`note-${value}`);
        cell.appendChild(note);
    }
}

// Save and Restor user inputs

function saveUserInputs() {
    userInputs = [];
    const rows = sudokuBoard.getElementsByClassName('row');
    for (let i = 0; i < rows.length; i++) {
        userInputs[i] = [];
        const cells = rows[i].getElementsByClassName('cell');
        for (let j = 0; j < cells.length; j++) {
            userInputs[i][j] = cells[j].textContent.trim() || '';
        }
    }
}

function restoreUserInputs() {
    const rows = sudokuBoard.getElementsByClassName('row');
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByClassName('cell');
        for (let j = 0; j < cells.length; j++) {
            cells[j].textContent = userInputs[i][j] || '';
        }
    }
}


// Toggle pause and resume functionality
function togglePauseResume() {
    if (isPaused) {
        // Resume the game
        renderBoard(puzzleBackup, true); // Restore the board and user inputs
        startTimer();
        pauseButton.innerHTML = '<i class="fas fa-pause"></i>'; // Set to pause icon
    } else {
        // Pause the game
        stopTimer();
        saveUserInputs(); // Save current user inputs
        renderEmptyBoard(); // Show an empty board
        pauseButton.innerHTML = '<i class="fas fa-play"></i>'; // Set to play icon
    }
    isPaused = !isPaused; // Toggle the pause state
}

// Start a new game with selected difficulty
async function startGame() {
    const difficulty = difficultySelect.value;
    const puzzleData = await fetchPuzzleData(difficulty);
    puzzleBackup = convertToGrid(puzzleData.puzzle);
    currentSolution = convertToGrid(puzzleData.solution);
    renderBoard(puzzleBackup);
    resetTimer();
    startTimer();
    saveUserInputs();
    updateHeader('solo');
    storeInitialBoardState();
    scoreboard.classList.add('hidden');
    roomCodeDiv.classList.add('hidden');
    pauseButton.disabled = false;
    pauseButton.innerHTML = '<i class="fas fa-pause"></i>'; // Set to pause icon initially
    isPaused = false;
}





// Render the Sudoku board with numbers and optionally restore user inputs
function renderBoard(puzzle, restoreInputs = false) {
    sudokuBoard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        let row = document.createElement('div');
        row.classList.add('row');
        for (let j = 0; j < 9; j++) {
            let cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;

            // Display prefilled numbers as non-editable
            if (puzzle[i][j] !== 0) {
                cell.textContent = puzzle[i][j];
                cell.dataset.prefilled = "true";
                cell.classList.add('prefilled');
            } else if (restoreInputs && userInputs[i] && userInputs[i][j]) {
                cell.textContent = userInputs[i][j];
                cell.classList.add('user-entered');
            }
            row.appendChild(cell);
        }
        sudokuBoard.appendChild(row);
    }
    addCellSelectionListeners();
}


// Render an empty Sudoku board
function renderEmptyBoard() {
    sudokuBoard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        let row = document.createElement('div');
        row.classList.add('row');
        for (let j = 0; j < 9; j++) {
            let cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            row.appendChild(cell);
        }
        sudokuBoard.appendChild(row);
    }
}

// Timer functions
function startTimer() {
    timer = setInterval(() => {
        time++;
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;
        timerDisplay.textContent = `Time: ${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
}

function resetTimer() {
    stopTimer();
    time = 0;
    timerDisplay.textContent = 'Time: 00:00';
}

// Initialize an empty board and add listeners
renderEmptyBoard();

// Event listeners for game control buttons
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePauseResume);

// Event listener for erasing content with the erase button
eraseButton.addEventListener('click', () => {
    if (selectedCell && !selectedCell.dataset.prefilled) {
        selectedCell.textContent = ''; // Clear the cell's content
        selectedCell.classList.remove('user-entered'); // Remove user-entered style
        clearHighlights();
    }
});



// Function to clear the selected cell
function clearSelectedCell() {
    if (selectedCell) {
        selectedCell.classList.remove('selected');
        selectedCell = null;
        clearHighlights();
    }
}

document.body.addEventListener('click', (event) => {
    const isClickInsideBoard = event.target.closest('#sudoku-board');
    const isClickInsideInteractiveElement = event.target.closest('button, #number-pad');

    // Deselect only if the click is outside the board and not on any button or interactive element
    if (!isClickInsideBoard && !isClickInsideInteractiveElement) {
        clearSelectedCell();
        clearHighlights();
    }
});

/*
// Toggle the color palette visibility
paintButton.addEventListener('click', () => {
    colorPalette.style.display = colorPalette.style.display === 'flex' ? 'none' : 'flex';
    event.stopPropagation(); // Prevent closing immediately when clicking on the paint button
});
*/

// Handle color selection from the palette
colorPalette.addEventListener('click', (event) => {
    const colorOption = event.target.closest('.color-option');
    if (colorOption) {
        selectedColor = colorOption.getAttribute('data-color');
        paintButton.style.borderColor = selectedColor; // Change paint button color
        colorPalette.classList.add('hidden'); // Hide color palette after selection
    }
    event.stopPropagation();
});

document.addEventListener('click', (event) => {
    if (colorPalette.style.display === 'flex') {
        colorPalette.style.display = 'none';
    }
});

const scoreboard = document.getElementById("scoreboard");
const scoreboardHeader = document.getElementById("scoreboard-header");
const scoreboardTableBody = document.querySelector('#scoreboard-table tbody');
const refreshScoreboardButton = document.getElementById('refresh-scoreboard');
const toggleArrow = document.getElementById("toggle-arrow");


scoreboardHeader.addEventListener("click", () => {
    if (event.target.id === "refresh-scoreboard") {
        return;
    }
    const isExpanded = scoreboard.classList.toggle("expanded"); // Toggle the expanded class
    toggleArrow.textContent = isExpanded ? "▼" : "▲";
    refreshScoreboardButton.style.display = isExpanded ? "inline-block" : "none";
    fetchScoreboard(room_Code);
});


// Function to fetch and display scoreboard data
async function fetchScoreboard(roomCode) {
    try {
        // Fetch scoreboard data for the given roomCode
        const response = await fetch(`${BASE_URL}/scoreboard/${roomCode}`);
        if (response.ok) {
            const scores = await response.json();

            // Clear existing rows
            scoreboardTableBody.innerHTML = '';

            // Populate the table with fetched scores
            scores.forEach(({ player_name, percentage_completed, time_taken }) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${player_name}</td>
                    <td>${percentage_completed}%</td>
                    <td>${time_taken}</td>
                `;
                scoreboardTableBody.appendChild(row);
            });
        } else {
            console.error('Error fetching scoreboard data:', response.statusText);
        }
    } catch (error) {
        console.error('Network error while fetching scoreboard:', error);
    }
}

refreshScoreboardButton.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent click from propagating to the header

    // Add refresh functionality here
    console.log("Scoreboard refreshed!");
    console.log(room_Code)
    fetchScoreboard(room_Code)
});

// Refresh scoreboard on button click
//refreshScoreboardButton.addEventListener('click', fetchScoreboard(room_Code));

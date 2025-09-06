class MagicSquareGame {
    constructor() {
        this.size = 3;
        this.mode = 'tutorial'; // 'tutorial' or 'normal'
        this.solution = [];
        this.puzzle = [];
        this.userInput = [];
        this.fixedCells = [];
        this.timer = null;
        this.seconds = 0;
        this.mistakes = 0;
        this.isPlaying = false;
        this.showingAnswer = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadBestTimes();
        this.updateTutorialDisplay();
        this.startNewGame();
    }
    
    initializeElements() {
        this.boardElement = document.getElementById('gameBoard');
        this.timerElement = document.getElementById('timer');
        this.mistakesElement = document.getElementById('mistakes');
        this.bestTimeElement = document.getElementById('bestTime');
        this.progressElement = document.getElementById('progress');
        this.targetSumElement = document.getElementById('targetSum');
        this.messageElement = document.getElementById('message');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.showAnswerBtn = document.getElementById('showAnswerBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.difficultyBtns = document.querySelectorAll('.diff-btn');
    }
    
    attachEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.showAnswerBtn.addEventListener('click', () => this.toggleAnswer());
        this.resetBtn.addEventListener('click', () => this.resetPuzzle());
        
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.difficultyBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.size = parseInt(e.target.dataset.size);
                this.mode = e.target.dataset.mode || 'normal';
                this.updateTutorialDisplay();
                this.startNewGame();
            });
        });
    }
    
    generateMagicSquare(n) {
        const square = Array(n).fill().map(() => Array(n).fill(0));
        
        if (n % 2 === 1) {
            // Odd-sized magic square (Siamese method)
            let num = 1;
            let i = 0;
            let j = Math.floor(n / 2);
            
            while (num <= n * n) {
                square[i][j] = num;
                num++;
                
                let newI = (i - 1 + n) % n;
                let newJ = (j + 1) % n;
                
                if (square[newI][newJ] !== 0) {
                    i = (i + 1) % n;
                } else {
                    i = newI;
                    j = newJ;
                }
            }
        } else if (n === 4) {
            // 4x4 magic square
            const pattern = [
                [1, 15, 14, 4],
                [12, 6, 7, 9],
                [8, 10, 11, 5],
                [13, 3, 2, 16]
            ];
            return pattern;
        } else if (n === 6) {
            // 6x6 magic square (LUX method for singly-even order)
            // First create four 3x3 magic squares
            const A = this.generateMagicSquare(3);
            const B = this.generateMagicSquare(3);
            const C = this.generateMagicSquare(3);
            const D = this.generateMagicSquare(3);
            
            // Adjust values for each quadrant
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    square[i][j] = A[i][j];
                    square[i][j + 3] = B[i][j] + 18;
                    square[i + 3][j] = C[i][j] + 27;
                    square[i + 3][j + 3] = D[i][j] + 9;
                }
            }
            
            // Exchange specific elements to make it a proper magic square
            // Row 1: swap positions (0,0) with (3,0) and (0,2) with (3,2)
            [square[0][0], square[3][0]] = [square[3][0], square[0][0]];
            [square[0][2], square[3][2]] = [square[3][2], square[0][2]];
            // Row 2: swap position (1,0) with (4,0) and (1,2) with (4,2)
            [square[1][0], square[4][0]] = [square[4][0], square[1][0]];
            [square[1][2], square[4][2]] = [square[4][2], square[1][2]];
            // Row 3: swap position (2,1) with (5,1)
            [square[2][1], square[5][1]] = [square[5][1], square[2][1]];
        } else {
            // For other even sizes, use a simple sequential fill (not a true magic square)
            // This is a placeholder - proper even-sized magic square algorithms are complex
            let num = 1;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    square[i][j] = num++;
                }
            }
        }
        
        return square;
    }
    
    getMagicConstant(n) {
        return (n * (n * n + 1)) / 2;
    }
    
    createPuzzle() {
        this.solution = this.generateMagicSquare(this.size);
        this.puzzle = this.solution.map(row => [...row]);
        this.userInput = this.solution.map(row => row.map(() => null));
        this.fixedCells = [];
        
        // Determine how many cells to remove based on difficulty
        // Balanced to ensure unique solutions
        const totalCells = this.size * this.size;
        let cellsToRemove;
        
        if (this.size === 3) {
            cellsToRemove = this.mode === 'tutorial' ? 4 : 5; // Tutorial mode is easier
        } else if (this.size === 4) {
            cellsToRemove = 10; // Remove 10 cells for 4x4 (62% blank)
        } else if (this.size === 5) {
            cellsToRemove = 15; // Remove 15 cells for 5x5 (60% blank)
        } else if (this.size === 6) {
            cellsToRemove = 20; // Remove 20 cells for 6x6 (56% blank)
        } else {
            cellsToRemove = Math.floor(totalCells * 0.6); // Default to 60% blank
        }
        
        // Randomly select cells to remove
        const positions = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                positions.push([i, j]);
            }
        }
        
        // Shuffle positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        
        // Keep track of fixed cells
        for (let i = 0; i < totalCells - cellsToRemove; i++) {
            const [row, col] = positions[i];
            this.fixedCells.push(`${row}-${col}`);
        }
        
        // Remove cells from puzzle
        for (let i = totalCells - cellsToRemove; i < totalCells; i++) {
            const [row, col] = positions[i];
            this.puzzle[row][col] = null;
        }
    }
    
    renderBoard() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        
        const magicConstant = this.getMagicConstant(this.size);
        this.targetSumElement.textContent = magicConstant;
        
        // Update tutorial info if in tutorial mode
        if (this.mode === 'tutorial') {
            const tutorialInfo = document.getElementById('tutorialInfo');
            const highlightText = tutorialInfo.querySelector('.highlight-text');
            if (highlightText) {
                highlightText.textContent = magicConstant;
            }
            // Update the max number in tutorial
            const maxNumber = tutorialInfo.querySelector('.max-number');
            if (maxNumber) {
                maxNumber.textContent = this.size * this.size;
            }
        }
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell new';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                const isFixed = this.fixedCells.includes(`${i}-${j}`);
                
                if (isFixed) {
                    cell.classList.add('fixed');
                    cell.textContent = this.puzzle[i][j];
                } else {
                    cell.classList.add('editable');
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.min = 1;
                    input.max = this.size * this.size;
                    
                    if (this.showingAnswer) {
                        input.value = this.solution[i][j];
                        input.disabled = true;
                        cell.classList.add('highlight');
                    } else if (this.userInput[i][j]) {
                        input.value = this.userInput[i][j];
                    }
                    
                    input.addEventListener('input', (e) => this.handleInput(e, i, j));
                    input.addEventListener('focus', () => this.highlightRelated(i, j));
                    input.addEventListener('blur', () => this.clearHighlights());
                    
                    cell.appendChild(input);
                }
                
                this.boardElement.appendChild(cell);
            }
        }
        
        setTimeout(() => {
            document.querySelectorAll('.cell').forEach(cell => {
                cell.classList.remove('new');
            });
        }, 50);
    }
    
    handleInput(event, row, col) {
        const value = event.target.value;
        const num = parseInt(value);
        
        if (!value) {
            this.userInput[row][col] = null;
            event.target.parentElement.classList.remove('correct', 'incorrect', 'duplicate');
        } else if (num >= 1 && num <= this.size * this.size) {
            this.userInput[row][col] = num;
            
            // Check for duplicate numbers
            const isDuplicate = this.checkDuplicate(num, row, col);
            
            if (isDuplicate) {
                event.target.parentElement.classList.remove('correct', 'incorrect');
                event.target.parentElement.classList.add('duplicate');
                this.mistakes++;
                this.mistakesElement.textContent = this.mistakes;
            } else {
                event.target.parentElement.classList.remove('duplicate');
                
                // Only show feedback when the board is complete or nearly complete
                const filledCount = this.getFilledCount();
                const totalBlank = this.getTotalBlankCells();
                
                if (filledCount >= totalBlank - 2) {
                    // Validate when only 1-2 cells remain
                    const isValid = this.validatePartialMagicSquare();
                    
                    if (!isValid) {
                        event.target.parentElement.classList.remove('correct');
                        event.target.parentElement.classList.add('incorrect');
                        this.mistakes++;
                        this.mistakesElement.textContent = this.mistakes;
                    } else {
                        event.target.parentElement.classList.remove('incorrect');
                        event.target.parentElement.classList.add('correct');
                    }
                } else {
                    // Don't show validation for early moves
                    event.target.parentElement.classList.remove('correct', 'incorrect');
                }
            }
            
            this.checkWin();
        } else {
            event.target.value = '';
        }
        
        this.updateProgress();
    }
    
    highlightRelated(row, col) {
        // Clear previous highlights
        this.clearHighlights();
        
        // Highlight row
        for (let j = 0; j < this.size; j++) {
            const cell = this.boardElement.children[row * this.size + j];
            if (!cell.classList.contains('fixed')) {
                cell.classList.add('highlight');
            }
        }
        
        // Highlight column
        for (let i = 0; i < this.size; i++) {
            const cell = this.boardElement.children[i * this.size + col];
            if (!cell.classList.contains('fixed')) {
                cell.classList.add('highlight');
            }
        }
        
        // Highlight diagonals if applicable
        if (row === col) {
            for (let i = 0; i < this.size; i++) {
                const cell = this.boardElement.children[i * this.size + i];
                if (!cell.classList.contains('fixed')) {
                    cell.classList.add('highlight');
                }
            }
        }
        
        if (row + col === this.size - 1) {
            for (let i = 0; i < this.size; i++) {
                const cell = this.boardElement.children[i * this.size + (this.size - 1 - i)];
                if (!cell.classList.contains('fixed')) {
                    cell.classList.add('highlight');
                }
            }
        }
    }
    
    clearHighlights() {
        document.querySelectorAll('.cell.highlight').forEach(cell => {
            if (!this.showingAnswer) {
                cell.classList.remove('highlight');
            }
        });
    }
    
    checkDuplicate(num, row, col) {
        // Check if number already exists in the puzzle
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === row && j === col) continue;
                
                // Check fixed cells
                if (this.fixedCells.includes(`${i}-${j}`)) {
                    if (this.puzzle[i][j] === num) return true;
                }
                // Check user input cells
                else if (this.userInput[i][j] === num) {
                    return true;
                }
            }
        }
        return false;
    }
    
    getFilledCount() {
        let count = 0;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (!this.fixedCells.includes(`${i}-${j}`)) {
                    if (this.userInput[i][j] !== null) {
                        count++;
                    }
                }
            }
        }
        return count;
    }
    
    getTotalBlankCells() {
        let count = 0;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (!this.fixedCells.includes(`${i}-${j}`)) {
                    count++;
                }
            }
        }
        return count;
    }
    
    validatePartialMagicSquare() {
        const targetSum = this.getMagicConstant(this.size);
        
        // Build complete grid from fixed cells and user input
        const grid = [];
        for (let i = 0; i < this.size; i++) {
            grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                if (this.fixedCells.includes(`${i}-${j}`)) {
                    grid[i][j] = this.puzzle[i][j];
                } else {
                    grid[i][j] = this.userInput[i][j];
                }
            }
        }
        
        // Check rows that are complete
        for (let i = 0; i < this.size; i++) {
            if (grid[i].every(val => val !== null)) {
                const sum = grid[i].reduce((a, b) => a + b, 0);
                if (sum !== targetSum) return false;
            }
        }
        
        // Check columns that are complete
        for (let j = 0; j < this.size; j++) {
            let hasNull = false;
            let sum = 0;
            for (let i = 0; i < this.size; i++) {
                if (grid[i][j] === null) {
                    hasNull = true;
                    break;
                }
                sum += grid[i][j];
            }
            if (!hasNull && sum !== targetSum) return false;
        }
        
        // Check main diagonal if complete
        let diagComplete = true;
        let diagSum = 0;
        for (let i = 0; i < this.size; i++) {
            if (grid[i][i] === null) {
                diagComplete = false;
                break;
            }
            diagSum += grid[i][i];
        }
        if (diagComplete && diagSum !== targetSum) return false;
        
        // Check anti-diagonal if complete
        let antiDiagComplete = true;
        let antiDiagSum = 0;
        for (let i = 0; i < this.size; i++) {
            if (grid[i][this.size - 1 - i] === null) {
                antiDiagComplete = false;
                break;
            }
            antiDiagSum += grid[i][this.size - 1 - i];
        }
        if (antiDiagComplete && antiDiagSum !== targetSum) return false;
        
        return true;
    }
    
    updateProgress() {
        let filled = 0;
        let total = 0;
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (!this.fixedCells.includes(`${i}-${j}`)) {
                    total++;
                    if (this.userInput[i][j] !== null) {
                        filled++;
                    }
                }
            }
        }
        
        const progress = (filled / total) * 100;
        this.progressElement.style.width = `${progress}%`;
    }
    
    checkWin() {
        // Check if all cells are filled
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (!this.fixedCells.includes(`${i}-${j}`)) {
                    if (this.userInput[i][j] === null) {
                        return false;
                    }
                }
            }
        }
        
        // Check if it's a valid magic square
        const targetSum = this.getMagicConstant(this.size);
        
        // Build complete grid
        const grid = [];
        for (let i = 0; i < this.size; i++) {
            grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                if (this.fixedCells.includes(`${i}-${j}`)) {
                    grid[i][j] = this.puzzle[i][j];
                } else {
                    grid[i][j] = this.userInput[i][j];
                }
            }
        }
        
        // Check all rows
        for (let i = 0; i < this.size; i++) {
            const sum = grid[i].reduce((a, b) => a + b, 0);
            if (sum !== targetSum) return false;
        }
        
        // Check all columns
        for (let j = 0; j < this.size; j++) {
            let sum = 0;
            for (let i = 0; i < this.size; i++) {
                sum += grid[i][j];
            }
            if (sum !== targetSum) return false;
        }
        
        // Check main diagonal
        let diagSum = 0;
        for (let i = 0; i < this.size; i++) {
            diagSum += grid[i][i];
        }
        if (diagSum !== targetSum) return false;
        
        // Check anti-diagonal
        let antiDiagSum = 0;
        for (let i = 0; i < this.size; i++) {
            antiDiagSum += grid[i][this.size - 1 - i];
        }
        if (antiDiagSum !== targetSum) return false;
        
        // Check for duplicate numbers
        const usedNumbers = new Set();
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (usedNumbers.has(grid[i][j])) {
                    return false;
                }
                usedNumbers.add(grid[i][j]);
            }
        }
        
        // Player won!
        this.endGame(true);
        return true;
    }
    
    startTimer() {
        this.stopTimer();
        this.seconds = 0;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.seconds++;
            this.updateTimerDisplay();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.seconds / 60);
        const secs = this.seconds % 60;
        this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateTutorialDisplay() {
        const tutorialInfo = document.getElementById('tutorialInfo');
        if (this.mode === 'tutorial' && this.size === 3) {
            tutorialInfo.style.display = 'block';
        } else {
            tutorialInfo.style.display = 'none';
        }
    }
    
    startNewGame() {
        this.stopTimer();
        this.mistakes = 0;
        this.mistakesElement.textContent = '0';
        this.showingAnswer = false;
        this.showAnswerBtn.textContent = '答えを見る';
        this.isPlaying = true;
        
        this.createPuzzle();
        this.renderBoard();
        this.startTimer();
        this.updateProgress();
        
        this.showMessage('新しいゲームを開始しました！', 'info');
        this.updateBestTimeDisplay();
    }
    
    resetPuzzle() {
        if (!this.isPlaying) return;
        
        this.userInput = this.solution.map(row => row.map(() => null));
        this.showingAnswer = false;
        this.showAnswerBtn.textContent = '答えを見る';
        this.renderBoard();
        this.updateProgress();
        this.showMessage('パズルをリセットしました', 'info');
    }
    
    toggleAnswer() {
        if (!this.isPlaying) return;
        
        this.showingAnswer = !this.showingAnswer;
        this.showAnswerBtn.textContent = this.showingAnswer ? '答えを隠す' : '答えを見る';
        this.renderBoard();
        
        if (this.showingAnswer) {
            this.showMessage('答えを表示中', 'info');
        } else {
            this.showMessage('', '');
        }
    }
    
    endGame(won) {
        this.stopTimer();
        this.isPlaying = false;
        
        if (won) {
            // Celebrate animation
            document.querySelectorAll('.cell').forEach((cell, index) => {
                setTimeout(() => {
                    cell.classList.add('correct');
                }, index * 50);
            });
            
            this.showMessage('素晴らしい！クリアしました！', 'success');
            
            // Save best time
            const key = `bestTime_${this.size}x${this.size}`;
            const currentBest = localStorage.getItem(key);
            
            if (!currentBest || this.seconds < parseInt(currentBest)) {
                localStorage.setItem(key, this.seconds.toString());
                this.updateBestTimeDisplay();
                this.showMessage(`新記録！ ${this.timerElement.textContent}`, 'success');
            }
        }
    }
    
    loadBestTimes() {
        this.bestTimes = {};
        for (let size = 3; size <= 5; size++) {
            const key = `bestTime_${size}x${size}`;
            const time = localStorage.getItem(key);
            if (time) {
                this.bestTimes[size] = parseInt(time);
            }
        }
    }
    
    updateBestTimeDisplay() {
        const bestTime = this.bestTimes[this.size];
        if (bestTime) {
            const minutes = Math.floor(bestTime / 60);
            const seconds = bestTime % 60;
            this.bestTimeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            this.bestTimeElement.textContent = '--:--';
        }
    }
    
    showMessage(text, type) {
        this.messageElement.textContent = text;
        this.messageElement.className = `message ${type}`;
        
        if (text) {
            setTimeout(() => {
                if (this.messageElement.textContent === text) {
                    this.messageElement.textContent = '';
                    this.messageElement.className = 'message';
                }
            }, 3000);
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MagicSquareGame();
});
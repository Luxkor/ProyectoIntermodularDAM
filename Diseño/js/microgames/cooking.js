window.Microgames = window.Microgames || {};

window.Microgames.cooking = {
    id: 'cooking',
    instruction: '¡COCINA EL PLATO!',
    setup: (container, score, game) => {
        const cookingContainer = document.createElement('div');
        cookingContainer.className = 'cooking-container';
        container.appendChild(cookingContainer);

        const recipes = [
            { name: 'PIZZA', ingredients: ['🍞', '🍅', '🧀'], color: '#ff9800' },
            { name: 'HAMBURGUESA', ingredients: ['🍔', '🥩', '🥬'], color: '#ff5722' },
            { name: 'ENSALADA', ingredients: ['🥬', '🍅', '🥒'], color: '#4caf50' },
            { name: 'SUSHI', ingredients: ['🍚', '🐟', '🥢'], color: '#e91e63' }
        ];

        const recipe = recipes[Math.floor(Math.random() * recipes.length)];
        let currentIngredients = [];

        // Header with target dish
        const header = document.createElement('div');
        header.className = 'cooking-header';
        header.innerHTML = `RECETA: <span style="color: ${recipe.color}">${recipe.name}</span>`;
        cookingContainer.appendChild(header);

        // Recipe display (needed ingredients)
        const targetDisplay = document.createElement('div');
        targetDisplay.className = 'target-ingredients';
        recipe.ingredients.forEach(ing => {
            const span = document.createElement('span');
            span.innerHTML = ing;
            span.className = 'target-ing';
            span.id = `target-${ing}`;
            targetDisplay.appendChild(span);
        });
        cookingContainer.appendChild(targetDisplay);

        // Pot/Plate area
        const plate = document.createElement('div');
        plate.className = 'cooking-plate';
        plate.innerHTML = '🍳';
        cookingContainer.appendChild(plate);

        // Limitar opciones a 8 (los 3 correctos + 5 distractores al azar)
        const allIngredients = ['🍞', '🍅', '🧀', '🍔', '🥩', '🥬', '🥒', '🍚', '🐟', '🥢', '🥚', '🥓', '🍄', '🌽'];
        const wrongIngredients = allIngredients.filter(ing => !recipe.ingredients.includes(ing)).sort(() => Math.random() - 0.5);
        const pool = [...recipe.ingredients, ...wrongIngredients.slice(0, 5)].sort(() => Math.random() - 0.5);

        const ingredientGrid = document.createElement('div');
        ingredientGrid.className = 'ingredient-grid';
        cookingContainer.appendChild(ingredientGrid);

        pool.forEach(ing => {
            const btn = document.createElement('div');
            btn.className = 'ing-btn';
            btn.innerHTML = ing;

            btn.onclick = () => {
                if (btn.classList.contains('used')) return;

                if (recipe.ingredients.includes(ing)) {
                    // Correct ingredient
                    btn.classList.add('used', 'correct');
                    currentIngredients.push(ing);

                    // Highlight in recipe list
                    const targetSpan = document.getElementById(`target-${ing}`);
                    if (targetSpan) targetSpan.classList.add('found');

                    // Animation on plate
                    const effect = document.createElement('div');
                    effect.className = 'cook-effect';
                    effect.innerHTML = ing;
                    plate.appendChild(effect);
                    setTimeout(() => effect.remove(), 600);

                    if (currentIngredients.length === recipe.ingredients.length) {
                        plate.innerHTML = '✨🥘✨';
                        setTimeout(() => game.onWin(), 400);
                    }
                } else {
                    // Wrong ingredient
                    btn.classList.add('wrong');
                    setTimeout(() => btn.classList.remove('wrong'), 300);

                    // Flash plate red
                    plate.classList.add('shake-red');
                    setTimeout(() => plate.classList.remove('shake-red'), 400);
                }
            };

            ingredientGrid.appendChild(btn);
        });

        const style = document.createElement('style');
        style.id = 'cooking-styles';
        style.textContent = `
            .cooking-container {
                width: 100%;
                height: 100%;
                background: #fdf5e6;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
                border-radius: 20px;
                color: #333;
                position: relative;
            }
            .cooking-header {
                font-size: 1.8rem;
                font-weight: 900;
                margin-bottom: 10px;
            }
            .target-ingredients {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
            }
            .target-ing {
                font-size: 2rem;
                opacity: 0.3;
                filter: grayscale(1);
                transition: all 0.3s;
                background: rgba(0,0,0,0.05);
                padding: 5px 10px;
                border-radius: 10px;
            }
            .target-ing.found {
                opacity: 1;
                filter: grayscale(0);
                background: white;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                transform: scale(1.1);
            }
            .cooking-plate {
                font-size: 5rem;
                margin: 20px 0;
                position: relative;
                transition: transform 0.2s;
            }
            .ingredient-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-top: auto;
                margin-bottom: 20px;
            }
            .ing-btn {
                font-size: 4rem;
                background: white;
                width: 100px;
                height: 100px;
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 20px;
                cursor: pointer;
                box-shadow: 0 6px 0 #ddd;
                transition: all 0.1s;
                user-select: none;
            }
            .ing-btn:active {
                transform: translateY(4px);
                box-shadow: 0 2px 0 #ddd;
            }
            .ing-btn.used {
                opacity: 0.5;
                pointer-events: none;
                background: #eee;
            }
            .ing-btn.wrong {
                background: #ffcdd2;
                animation: shake 0.3s;
            }
            .cook-effect {
                position: absolute;
                top: 0;
                left: 50%;
                font-size: 2rem;
                animation: popUp 0.6s ease-out forwards;
            }
            @keyframes popUp {
                0% { transform: translate(-50%, 0) scale(0.5); opacity: 1; }
                100% { transform: translate(-50%, -100px) scale(1.5); opacity: 0; }
            }
            .shake-red {
                animation: shakeRed 0.4s;
            }
            @keyframes shakeRed {
                0%, 100% { transform: rotate(0); color: inherit; }
                25% { transform: rotate(10deg); color: red; }
                75% { transform: rotate(-10deg); color: red; }
            }
            @media (max-width: 600px) {
                .ingredient-grid {
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                }
                .ing-btn {
                    width: 70px;
                    height: 70px;
                    font-size: 2.8rem;
                }
            }
        `;
        document.head.appendChild(style);

        return {
            cleanup: () => {
                const s = document.getElementById('cooking-styles');
                if (s) s.remove();
            }
        };
    }
};

document.addEventListener('DOMContentLoaded', function() {
    try {
        // DOM Elements
        const paletteItems = document.querySelectorAll('.palette-item');
        const dropZones = document.querySelectorAll('.drop-zone');
        const propertiesForm = document.getElementById('element-properties-form');
        const deleteButton = document.getElementById('delete-element');
        
        if (!propertiesForm || !deleteButton) {
            throw new Error("Could not find required form elements");
        }

        // State
        let draggedItem = null;
        let selectedElement = null;
        
        // Palette Item Drag Start
        paletteItems.forEach(item => {
            item.addEventListener('dragstart', function(e) {
                const type = this.getAttribute('data-type');
                if (!type) {
                    console.error("Palette item missing data-type attribute");
                    return;
                }
                
                draggedItem = {
                    type: type,
                    html: this.innerHTML
                };
                e.dataTransfer.setData('text/plain', draggedItem.type);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });
        
        // Drop Zone Events
        dropZones.forEach(zone => {
            if (!zone) Continue;
            
            zone.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('highlight');
                e.dataTransfer.dropEffect = 'copy';
            });
            
            zone.addEventListener('dragleave', function() {
                this.classList.remove('highlight');
            });
            
            zone.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('highlight');
                
                if (!draggedItem) {
                    console.warn("No dragged item available");
                    return;
                }
                
                const newElement = createElement(draggedItem.type);
                if (newElement) {
                    this.appendChild(newElement);
                    selectElement(newElement);
                }
            });
        });
        
        // Element Creation
        function createElement(type) {
            try {
                const element = document.createElement('div');
                element.className = 'canvas-element';
                element.draggable = true;
                element.dataset.type = type;
                
                let content = '';
                switch(type) {
                    case 'text':
                        content = '<div class="element-content">New Text Block</div>';
                        break;
                    case 'image':
                        content = '<div class="element-content"><img src="https://via.placeholder.com/150" alt="Placeholder" style="max-width:100%"></div>';
                        break;
                    case 'button':
                        content = '<div class="element-content"><button>Click Me</button></div>';
                        break;
                    case 'divider':
                        content = '<div class="element-content"><hr></div>';
                        break;
                    default:
                        console.error("Unknown element type:", type);
                        return null;
                }
                
                element.innerHTML = content;
                
                // Make element draggable within canvas
                element.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', 'move');
                    this.classList.add('dragging');
                });
                
                element.addEventListener('dragend', function() {
                    this.classList.remove('dragging');
                });
                
                element.addEventListener('click', function(e) {
                    if (e.target.tagName !== 'BUTTON') {
                        selectElement(this);
                    }
                });
                
                return element;
            } catch (error) {
                console.error("Error creating element:", error);
                return null;
            }
        }
        
        // Element Selection
        function selectElement(element) {
            if (!element) return;
            
            // Deselect previous
            if (selectedElement) {
                selectedElement.classList.remove('selected');
            }
            
            // Select new
            selectedElement = element;
            element.classList.add('selected');
            
            // Update properties form
            updatePropertiesForm(element);
        }
        
        // Update Properties Form
        function updatePropertiesForm(element) {
            if (!element) return;
            
            try {
                const type = element.dataset.type;
                const contentElement = element.querySelector('.element-content');
                
                if (!contentElement) {
                    console.warn("No content element found");
                    return;
                }
                
                // Show/hide relevant fields based on element type
                const contentField = document.getElementById('element-content');
                const colorField = document.getElementById('element-color');
                const sizeField = document.getElementById('element-size');
                
                if (!contentField || !colorField || !sizeField) {
                    console.error("Form fields not found");
                    return;
                }
                
                contentField.style.display = 
                    (type === 'text' || type === 'button') ? 'block' : 'none';
                colorField.style.display = 
                    (type !== 'divider') ? 'block' : 'none';
                sizeField.style.display = 'block';
                
                // Set current values
                if (type === 'text') {
                    contentField.value = contentElement.textContent || '';
                    colorField.value = contentElement.style.color || '#000000';
                } else if (type === 'button') {
                    const button = contentElement.querySelector('button');
                    if (button) {
                        contentField.value = button.textContent || '';
                        colorField.value = button.style.backgroundColor || '#4CAF50';
                    }
                }
                
                // Reset fields for other element types
                if (type === 'image' || type === 'divider') {
                    contentField.value = '';
                    colorField.value = '#000000';
                }
            } catch (error) {
                console.error("Error updating properties form:", error);
            }
        }
        
        // Apply Properties
        propertiesForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!selectedElement) {
                console.warn("No element selected");
                return;
            }
            
            try {
                const type = selectedElement.dataset.type;
                const contentElement = selectedElement.querySelector('.element-content');
                
                if (!contentElement) {
                    console.warn("No content element found");
                    return;
                }
                
                const formData = new FormData(this);
                
                if (type === 'text') {
                    contentElement.textContent = formData.get('content') || '';
                    contentElement.style.color = formData.get('color') || '#000000';
                } else if (type === 'button') {
                    const button = contentElement.querySelector('button');
                    if (button) {
                        button.textContent = formData.get('content') || '';
                        button.style.backgroundColor = formData.get('color') || '#4CAF50';
                    }
                }
                
                // Apply size
                const size = formData.get('size') || 'medium';
                if (type === 'text') {
                    contentElement.style.fontSize = 
                        size === 'small' ? '14px' : 
                        size === 'medium' ? '16px' : '18px';
                } else if (type === 'button') {
                    const button = contentElement.querySelector('button');
                    if (button) {
                        button.style.padding = 
                            size === 'small' ? '5px 10px' : 
                            size === 'medium' ? '8px 15px' : '10px 20px';
                    }
                }
            } catch (error) {
                console.error("Error applying properties:", error);
            }
        });
        
        // Delete Element
        deleteButton.addEventListener('click', function() {
            try {
                if (selectedElement && selectedElement.parentNode) {
                    selectedElement.parentNode.removeChild(selectedElement);
                    selectedElement = null;
                    propertiesForm.reset();
                }
            } catch (error) {
                console.error("Error deleting element:", error);
            }
        });
        
        // Make drop zones sortable (for rearranging elements)
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', function(e) {
                try {
                    e.preventDefault();
                    const dragging = document.querySelector('.dragging');
                    if (dragging && dragging.parentNode === this) {
                        const afterElement = getDragAfterElement(this, e.clientY);
                        if (afterElement) {
                            this.insertBefore(dragging, afterElement);
                        } else {
                            this.appendChild(dragging);
                        }
                    }
                } catch (error) {
                    console.error("Error in drag sorting:", error);
                }
            });
        });
        
        function getDragAfterElement(container, y) {
            try {
                const draggableElements = [...container.querySelectorAll('.canvas-element:not(.dragging)')];
                
                return draggableElements.reduce((closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = y - box.top - box.height / 2;
                    
                    if (offset < 0 && offset > closest.offset) {
                        return { offset: offset, element: child };
                    } else {
                        return closest;
                    }
                }, { offset: Number.NEGATIVE_INFINITY }).element;
            } catch (error) {
                console.error("Error in getDragAfterElement:", error);
                return null;
            }
        }
    } catch (error) {
        console.error("Initialization error:", error);
        alert("An error occurred while initializing the page. Please check the console for details.");
    }
});
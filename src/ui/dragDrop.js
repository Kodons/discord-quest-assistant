/**
 * Helper Drag-and-Drop Floating Window
 */
function attachDragAndDrop(element, handle) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    function onMouseDown(e) {
        if (e.target.closest("button")) return;
        isDragging = true;
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        element.style.transition = "none";
    }

    function onMouseMove(e) {
        if (!isDragging) return;
        const left = Math.max(10, Math.min(window.innerWidth - element.offsetWidth - 10, e.clientX - offsetX));
        const top = Math.max(10, Math.min(window.innerHeight - element.offsetHeight - 10, e.clientY - offsetY));
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.right = "auto";
    }

    function onMouseUp() {
        isDragging = false;
        element.style.transition = "";
    }

    handle.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
        handle.removeEventListener("mousedown", onMouseDown);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };
}

module.exports = {
    attachDragAndDrop
};

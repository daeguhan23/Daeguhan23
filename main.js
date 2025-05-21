// 평가 항목 클래스
class Item {
    constructor(name = '', maxScore = 100, weight = 0, myScore = 0) {
        this.id = Date.now() + Math.random().toString(36).substring(2, 9); // 고유 ID 생성
        this.name = name;
        this.maxScore = maxScore;
        this.weight = weight;
        this.myScore = myScore;
        this.element = null; // DOM 요소 참조
    }

    // 반영 점수 계산 (실점 ÷ 만점 × 가중치)
    calculateReflectedScore() {
        if (this.maxScore <= 0 || this.myScore < 0 || this.myScore > this.maxScore) {
            return 0; // 오류 상태
        }
        return (this.myScore / this.maxScore) * this.weight;
    }

    // 항목 유효성 검사
    validate() {
        const errors = [];
        
        if (this.name.trim() === '') {
            errors.push('항목명은 필수입니다.');
        }
        
        if (this.maxScore <= 0) {
            errors.push('만점은 1 이상이어야 합니다.');
        }
        
        if (this.weight < 0) {
            errors.push('가중치는 0 이상이어야 합니다.');
        }
        
        if (this.myScore < 0 || this.myScore > this.maxScore) {
            errors.push('실점은 0 이상 만점 이하여야 합니다.');
        }
        
        return errors;
    }

    // 평가 항목 행 생성
    createRow(courseId) {
        const tr = document.createElement('tr');
        tr.dataset.itemId = this.id;
        
        // 항목명 입력
        const nameCell = document.createElement('td');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = this.name;
        nameInput.placeholder = '항목명';
        nameInput.addEventListener('input', () => {
            this.name = nameInput.value;
            courseManager.updateCourse(courseId);
        });
        nameCell.appendChild(nameInput);
        
        // 만점 입력
        const maxScoreCell = document.createElement('td');
        const maxScoreInput = document.createElement('input');
        maxScoreInput.type = 'number';
        maxScoreInput.inputMode = 'numeric';
        maxScoreInput.min = '1';
        maxScoreInput.value = this.maxScore;
        maxScoreInput.placeholder = '만점';
        maxScoreInput.addEventListener('input', () => {
            this.maxScore = parseFloat(maxScoreInput.value) || 0;
            courseManager.updateCourse(courseId);
        });
        maxScoreCell.appendChild(maxScoreInput);
        
        // 가중치 입력
        const weightCell = document.createElement('td');
        const weightInput = document.createElement('input');
        weightInput.type = 'number';
        weightInput.inputMode = 'numeric';
        weightInput.min = '0';
        weightInput.value = this.weight;
        weightInput.placeholder = '가중치(%)';
        weightInput.addEventListener('input', () => {
            this.weight = parseFloat(weightInput.value) || 0;
            courseManager.updateCourse(courseId);
        });
        weightCell.appendChild(weightInput);
        
        // 실점 입력
        const myScoreCell = document.createElement('td');
        const myScoreInput = document.createElement('input');
        myScoreInput.type = 'number';
        myScoreInput.inputMode = 'numeric';
        myScoreInput.min = '0';
        myScoreInput.max = this.maxScore.toString();
        myScoreInput.value = this.myScore;
        myScoreInput.placeholder = '내 점수';
        myScoreInput.addEventListener('input', () => {
            this.myScore = parseFloat(myScoreInput.value) || 0;
            courseManager.updateCourse(courseId);
        });
        myScoreCell.appendChild(myScoreInput);
        
        // 반영 점수 (계산값, 읽기 전용)
        const reflectedScoreCell = document.createElement('td');
        reflectedScoreCell.classList.add('reflected-score');
        reflectedScoreCell.textContent = this.calculateReflectedScore().toFixed(2);
        
        // 삭제 버튼
        const deleteCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-item');
        deleteBtn.innerHTML = '×';
        deleteBtn.title = '항목 삭제';
        deleteBtn.addEventListener('click', () => {
            courseManager.deleteItem(courseId, this.id);
        });
        deleteCell.appendChild(deleteBtn);
        
        // 행에 셀 추가
        tr.appendChild(nameCell);
        tr.appendChild(maxScoreCell);
        tr.appendChild(weightCell);
        tr.appendChild(myScoreCell);
        tr.appendChild(reflectedScoreCell);
        tr.appendChild(deleteCell);
        
        this.element = tr;
        return tr;
    }

    // 항목 업데이트
    update() {
        if (!this.element) return;
        
        // 각 입력 필드에 오류 표시
        const errors = this.validate();
        const hasErrors = errors.length > 0;
        
        const inputs = this.element.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.toggle('error', hasErrors);
            if (hasErrors) {
                input.title = errors.join('\n');
            } else {
                input.title = '';
            }
        });
        
        // 반영 점수 업데이트
        const reflectedScoreCell = this.element.querySelector('.reflected-score');
        reflectedScoreCell.textContent = this.calculateReflectedScore().toFixed(2);
    }
}

// 과목 클래스
class Course {
    constructor(name = '새 과목') {
        this.id = Date.now().toString();
        this.name = name;
        this.items = [];
        this.element = null; // DOM 요소 참조
    }

    // 과목 총점 계산
    calculateTotalScore() {
        // 유효한 항목만 필터링
        const validItems = this.items.filter(item => {
            const errors = item.validate();
            return errors.length === 0;
        });
        
        // 총 가중치 계산
        const totalWeight = validItems.reduce((sum, item) => sum + item.weight, 0);
        
        // 반영 점수 합계
        const totalReflectedScore = validItems.reduce((sum, item) => {
            return sum + item.calculateReflectedScore();
        }, 0);
        
        return {
            score: totalReflectedScore,
            totalWeight: totalWeight,
            isValid: Math.abs(totalWeight - 100) < 0.01 // 가중치 합계가 100%인지 확인 (부동소수점 오차 고려)
        };
    }

    // 항목 추가
    addItem(item = new Item()) {
        this.items.push(item);
        if (this.element) {
            const tableBody = this.element.querySelector('tbody');
            tableBody.appendChild(item.createRow(this.id));
        }
        return item;
    }

    // 항목 삭제
    deleteItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            // DOM에서 항목 삭제
            const item = this.items[index];
            if (item.element) {
                item.element.remove();
            }
            
            // 배열에서 항목 삭제
            this.items.splice(index, 1);
        }
    }

    // 과목 카드 렌더링
    render() {
        // 기존 카드가 있으면 삭제
        if (this.element && this.element.parentNode) {
            this.element.remove();
        }
        
        // 새 카드 생성
        const card = document.createElement('div');
        card.classList.add('course-card');
        card.dataset.courseId = this.id;
        
        // 카드 헤더
        const header = document.createElement('div');
        header.classList.add('course-header');
        
        const title = document.createElement('div');
        title.classList.add('course-title');
        title.contentEditable = true;
        title.textContent = this.name;
        title.addEventListener('input', () => {
            this.name = title.textContent;
            courseManager.saveCourses();
        });
        
        const headerActions = document.createElement('div');
        headerActions.classList.add('course-header-actions');
        
        // 복제 버튼
        const cloneBtn = document.createElement('button');
        cloneBtn.classList.add('secondary-btn');
        cloneBtn.textContent = '복제';
        cloneBtn.addEventListener('click', () => {
            courseManager.cloneCourse(this.id);
        });
        
        // 삭제 버튼
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('danger-btn');
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => {
            courseManager.deleteCourse(this.id);
        });
        
        headerActions.appendChild(cloneBtn);
        headerActions.appendChild(deleteBtn);
        
        header.appendChild(title);
        header.appendChild(headerActions);
        
        // 카드 콘텐츠
        const content = document.createElement('div');
        content.classList.add('course-content');
        
        // 가중치 경고 메시지
        const weightWarning = document.createElement('div');
        weightWarning.classList.add('weight-warning');
        weightWarning.textContent = '가중치 합계가 100%가 아닙니다.';
        
        // 항목 테이블
        const table = document.createElement('table');
        table.classList.add('items-table');
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['항목명', '만점', '가중치(%)', '내 점수', '반영점수', ''];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        
        const tbody = document.createElement('tbody');
        this.items.forEach(item => {
            tbody.appendChild(item.createRow(this.id));
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        
        // 항목 추가 버튼
        const addItemBtn = document.createElement('button');
        addItemBtn.classList.add('add-item-btn');
        addItemBtn.textContent = '+ 항목 추가';
        addItemBtn.addEventListener('click', () => {
            this.addItem();
            courseManager.updateCourse(this.id);
        });
        
        content.appendChild(weightWarning);
        content.appendChild(table);
        content.appendChild(addItemBtn);
        
        // 카드 푸터 (총점)
        const totalSection = document.createElement('div');
        totalSection.classList.add('course-total');
        
        const totalLabel = document.createElement('div');
        totalLabel.textContent = '과목 총점:';
        
        const totalScore = document.createElement('div');
        totalScore.classList.add('total-score');
        
        totalSection.appendChild(totalLabel);
        totalSection.appendChild(totalScore);
        
        // 카드 조립
        card.appendChild(header);
        card.appendChild(content);
        card.appendChild(totalSection);
        
        this.element = card;
        this.update(); // 초기 업데이트
        
        return card;
    }

    // 과목 카드 업데이트
    update() {
        if (!this.element) return;
        
        // 각 항목 업데이트
        this.items.forEach(item => item.update());
        
        // 총점 계산 및 표시
        const totalResult = this.calculateTotalScore();
        const totalScoreElement = this.element.querySelector('.total-score');
        totalScoreElement.textContent = totalResult.score.toFixed(2);
        
        // 가중치 경고 표시/숨김
        const weightWarning = this.element.querySelector('.weight-warning');
        weightWarning.classList.toggle('show', !totalResult.isValid);
    }
}

// 과목 관리 클래스
class CourseManager {
    constructor() {
        this.courses = [];
        this.coursesContainer = document.getElementById('courses-container');
    }

    // 과목 초기화 (로컬스토리지에서 로드 또는 새로 생성)
    init() {
        this.loadCourses();
        this.renderAllCourses();
        this.updateTotalStats();
    }

    // 새 과목 추가
    addCourse(name = '새 과목') {
        const course = new Course(name);
        this.courses.push(course);
        
        // 빈 상태 메시지 숨기기
        this.hideEmptyState();
        
        // 화면에 과목 카드 추가
        this.coursesContainer.appendChild(course.render());
        
        // 첫 항목 자동 추가
        course.addItem();
        
        // 데이터 저장 및 통계 업데이트
        this.saveCourses();
        this.updateTotalStats();
        
        return course;
    }

    // 과목 복제
    cloneCourse(courseId) {
        const course = this.getCourseById(courseId);
        if (!course) return;
        
        // 새 과목 생성
        const newCourse = new Course(`${course.name} (복사본)`);
        
        // 항목 복제 (점수는 0으로 초기화)
        course.items.forEach(item => {
            newCourse.addItem(new Item(item.name, item.maxScore, item.weight, 0));
        });
        
        // 과목 목록에 추가
        this.courses.push(newCourse);
        
        // 화면에 과목 카드 추가
        this.coursesContainer.appendChild(newCourse.render());
        
        // 데이터 저장 및 통계 업데이트
        this.saveCourses();
        this.updateTotalStats();
        
        showToast('과목이 복제되었습니다.');
    }

    // 과목 삭제
    deleteCourse(courseId) {
        const index = this.courses.findIndex(course => course.id === courseId);
        if (index !== -1) {
            // DOM에서 과목 카드 삭제
            const course = this.courses[index];
            if (course.element) {
                course.element.remove();
            }
            
            // 배열에서 과목 삭제
            this.courses.splice(index, 1);
            
            // 비어 있으면 빈 상태 메시지 표시
            if (this.courses.length === 0) {
                this.showEmptyState();
            }
            
            // 데이터 저장 및 통계 업데이트
            this.saveCourses();
            this.updateTotalStats();
            
            showToast('과목이 삭제되었습니다.');
        }
    }

    // 항목 삭제
    deleteItem(courseId, itemId) {
        const course = this.getCourseById(courseId);
        if (course) {
            course.deleteItem(itemId);
            this.updateCourse(courseId);
        }
    }

    // ID로 과목 찾기
    getCourseById(courseId) {
        return this.courses.find(course => course.id === courseId);
    }

    // 과목 업데이트
    updateCourse(courseId) {
        const course = this.getCourseById(courseId);
        if (course) {
            course.update();
            this.saveCourses();
            this.updateTotalStats();
        }
    }

    // 전체 통계 업데이트
    updateTotalStats() {
        const totalCoursesElement = document.getElementById('total-courses');
        const totalAverageElement = document.getElementById('total-average');
        
        totalCoursesElement.textContent = this.courses.length;
        
        if (this.courses.length === 0) {
            totalAverageElement.textContent = '0.0';
            return;
        }
        
        // 모든 과목의 총점 평균 계산
        const totalScores = this.courses.map(course => {
            return course.calculateTotalScore().score;
        });
        
        const average = totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length;
        totalAverageElement.textContent = average.toFixed(2);
    }

    // 모든 과목 렌더링
    renderAllCourses() {
        // 컨테이너 비우기
        this.coursesContainer.innerHTML = '';
        
        if (this.courses.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // 과목 카드 추가
        this.courses.forEach(course => {
            this.coursesContainer.appendChild(course.render());
        });
    }

    // 빈 상태 메시지 표시
    showEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.classList.add('empty-state');
        emptyState.innerHTML = '<p>과목 추가 버튼을 눌러 과목을 추가해보세요.</p>';
        this.coursesContainer.innerHTML = '';
        this.coursesContainer.appendChild(emptyState);
    }

    // 빈 상태 메시지 숨기기
    hideEmptyState() {
        const emptyState = this.coursesContainer.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
    }

    // 과목 데이터 저장 (로컬스토리지)
    saveCourses() {
        const coursesData = this.courses.map(course => {
            return {
                id: course.id,
                name: course.name,
                items: course.items.map(item => {
                    return {
                        id: item.id,
                        name: item.name,
                        maxScore: item.maxScore,
                        weight: item.weight,
                        myScore: item.myScore
                    };
                })
            };
        });
        
        localStorage.setItem('gradeCourses', JSON.stringify(coursesData));
    }

    // 과목 데이터 로드 (로컬스토리지)
    loadCourses() {
        const savedData = localStorage.getItem('gradeCourses');
        if (!savedData) return;
        
        try {
            const coursesData = JSON.parse(savedData);
            
            this.courses = coursesData.map(courseData => {
                const course = new Course(courseData.name);
                course.id = courseData.id;
                
                // 항목 복원
                course.items = courseData.items.map(itemData => {
                    const item = new Item(
                        itemData.name,
                        itemData.maxScore,
                        itemData.weight,
                        itemData.myScore
                    );
                    item.id = itemData.id;
                    return item;
                });
                
                return course;
            });
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            this.courses = [];
        }
    }

    // JSON으로 내보내기
    exportToJson() {
        const coursesData = this.courses.map(course => {
            return {
                name: course.name,
                items: course.items.map(item => {
                    return {
                        name: item.name,
                        maxScore: item.maxScore,
                        weight: item.weight,
                        myScore: item.myScore
                    };
                })
            };
        });
        
        return JSON.stringify(coursesData, null, 2);
    }

    // JSON에서 가져오기
    importFromJson(jsonData) {
        try {
            const coursesData = JSON.parse(jsonData);
            
            // 기존 과목 초기화
            this.courses = [];
            
            // 새 과목 생성
            coursesData.forEach(courseData => {
                const course = new Course(courseData.name);
                
                // 항목 추가
                courseData.items.forEach(itemData => {
                    course.addItem(new Item(
                        itemData.name,
                        itemData.maxScore,
                        itemData.weight,
                        itemData.myScore
                    ));
                });
                
                this.courses.push(course);
            });
            
            // 화면 업데이트
            this.renderAllCourses();
            this.saveCourses();
            this.updateTotalStats();
            
            showToast('데이터를 성공적으로 가져왔습니다.');
            
            return true;
        } catch (error) {
            console.error('데이터 가져오기 오류:', error);
            showToast('잘못된 형식의 데이터입니다.', true);
            return false;
        }
    }
}

// 토스트 메시지 표시
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.backgroundColor = isError ? 'var(--danger-color)' : 'rgba(0, 0, 0, 0.7)';
    
    toast.classList.add('show');
    
    // 3초 후 메시지 숨기기
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 초기화 및 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 과목 관리자 초기화
    const courseManager = new CourseManager();
    window.courseManager = courseManager; // 전역 접근용
    courseManager.init();
    
    // "과목 추가" 버튼 이벤트
    document.getElementById('add-course-btn').addEventListener('click', () => {
        courseManager.addCourse();
    });
    
    // 데이터 내보내기
    document.getElementById('export-btn').addEventListener('click', () => {
        const jsonData = courseManager.exportToJson();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = '성적계산기_데이터.json';
        a.click();
        
        URL.revokeObjectURL(url);
        showToast('데이터가 내보내기되었습니다.');
    });
    
    // 데이터 가져오기 (파일 선택 대화상자)
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    
    // 파일 선택 시 처리
    document.getElementById('import-file').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const jsonData = e.target.result;
            courseManager.importFromJson(jsonData);
        };
        reader.readAsText(file);
        
        // 파일 입력 초기화 (같은 파일 다시 선택 가능하도록)
        event.target.value = '';
    });
}); 
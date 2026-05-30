document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const interestInput = document.getElementById('interestInput');
    const bookList = document.getElementById('bookList');
    const loading = document.getElementById('loading');

    // 100개의 가상 도서 데이터 생성
    const mockBooks = generateMockBooks(100);

    // 검색 실행 함수
    const fetchBooks = () => {
        const query = interestInput.value.trim().toLowerCase();
        if (!query) {
            alert('관심사를 입력해주세요. (예: 위로, 사랑, 철학)');
            return;
        }

        // 초기화 및 로딩 표시
        bookList.innerHTML = '';
        loading.classList.remove('hidden');

        // 가짜 로딩 시간(0.8초)을 주어 검색하는 듯한 느낌 제공
        setTimeout(() => {
            loading.classList.add('hidden');

            // 검색 로직 (제목, 저자, 키워드 중 하나라도 포함되면 매칭)
            const filteredBooks = mockBooks.filter(book => {
                return book.title.toLowerCase().includes(query) ||
                       book.authors.toLowerCase().includes(query) ||
                       book.keywords.some(k => k.includes(query));
            });

            if (filteredBooks.length === 0) {
                bookList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">해당 관심사와 관련된 책을 찾지 못했습니다. 다른 키워드(예: 사랑, 우주, 위로)로 시도해보세요.</p>';
                return;
            }

            // 별점이 높은 순으로 정렬
            filteredBooks.sort((a, b) => b.stars - a.stars);

            // 화면에 렌더링 (최대 12개까지만 보여주기)
            renderBooks(filteredBooks.slice(0, 12));
        }, 800);
    };

    // 별 문자열 생성 함수
    const getStarString = (count) => {
        return '★'.repeat(count) + '☆'.repeat(5 - count);
    };

    // 렌더링 함수
    const renderBooks = (books) => {
        books.forEach((book, index) => {
            const delay = index * 0.1; // 순차적 애니메이션 딜레이
            const card = document.createElement('div');
            card.className = 'book-card';
            card.style.animationDelay = `${delay}s`;

            card.innerHTML = `
                <img src="${book.thumbnail}" alt="${book.title} 표지" class="book-thumb" loading="lazy">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.authors}</p>
                
                <div class="book-info">
                    <div class="rating-price">
                        <span class="stars" title="${book.stars}점">${getStarString(book.stars)}</span>
                        <span class="price">${book.priceText}</span>
                    </div>
                    <!-- 가상의 구매 링크 -->
                    <a href="#" class="buy-btn" onclick="alert('가상의 도서입니다. 실제로는 구매할 수 없습니다.'); return false;">자세히 보기 및 구매</a>
                </div>
            `;
            
            bookList.appendChild(card);
        });
    };

    // 이벤트 리스너 등록
    searchBtn.addEventListener('click', fetchBooks);
    
    interestInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchBooks();
        }
    });
});

// 가상 도서 데이터 생성 함수
function generateMockBooks(count) {
    const adjectives = ["따뜻한", "차가운", "별빛 내리는", "조용한", "잃어버린", "비밀스러운", "눈부신", "오래된", "슬픈", "행복한", "달콤한", "기묘한", "아름다운", "잔잔한", "신비로운"];
    const nouns = ["밤", "바다", "숲", "기억", "편지", "우주", "시간", "고양이", "마음", "계절", "정원", "별", "여행", "꿈", "노래"];
    const suffixes = ["의 노래", "을 찾아서", "과 함께", "이야기", "의 비밀", "의 끝", "에서 온 편지", "의 조각들", "속으로", ""];
    
    const authorNames = ["김서연", "이지훈", "박민수", "최유진", "정지안", "윤도현", "강하늘", "임수정", "한소희", "백지영", "무라카미 하루키", "알랭 드 보통", "베르나르 베르베르", "헤르만 헤세"];
    const allKeywords = ["위로", "사랑", "철학", "우주", "성장", "모험", "심리", "예술", "역사", "과학", "소설", "에세이", "시", "치유", "인생", "가족", "우정"];

    const books = [];

    for (let i = 0; i < count; i++) {
        // 제목 무작위 조합
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const title = `${adj} ${noun}${suffix}`;

        // 저자 무작위 선택
        const author = authorNames[Math.floor(Math.random() * authorNames.length)];

        // 키워드 2~3개 무작위 선택
        const shuffledKeywords = [...allKeywords].sort(() => 0.5 - Math.random());
        const keywords = shuffledKeywords.slice(0, Math.floor(Math.random() * 2) + 2);

        // 제목이나 저자 이름, 그리고 결합된 단어들을 키워드에 추가해서 검색이 잘 되게 함
        keywords.push(noun);
        if (adj === "따뜻한" || adj === "행복한") keywords.push("위로", "치유");
        if (noun === "우주" || noun === "별") keywords.push("과학", "우주");

        // 평점 1~5 (3~5점이 많이 나오도록 가중치)
        const randStar = Math.random();
        let stars = 3;
        if (randStar > 0.8) stars = 5;
        else if (randStar > 0.5) stars = 4;
        else if (randStar > 0.2) stars = 3;
        else if (randStar > 0.05) stars = 2;
        else stars = 1;

        // 가격 (10000원 ~ 25000원)
        const priceNum = Math.floor(Math.random() * 15 + 10) * 1000;
        const priceText = priceNum.toLocaleString() + '원';

        // 썸네일 (picsum을 사용하여 고유하고 감성적인 이미지 제공)
        const seed = Math.floor(Math.random() * 10000);
        const thumbnail = `https://picsum.photos/seed/${seed}/280/350`;

        books.push({
            id: i,
            title: title,
            authors: author,
            keywords: keywords,
            stars: stars,
            priceText: priceText,
            thumbnail: thumbnail
        });
    }

    return books;
}

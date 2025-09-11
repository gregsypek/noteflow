interface Tag {
  _id: string;
  name: string;
}

interface Author {
  _id: string;
  name: string;
  image: string;
}

interface Question {
  _id: string;
  title: string;
  content: string;
  tags: Tag[];
  author: Author;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  answers: number;
  views: number;
  createdAt: date;
}

type ActionResponse<T = null> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: Record<string, string[]>;
  };
  status?: number;
};
// null – "intencjonalny brak wartości" (np. dane mogą być puste, ale to świadomy wybór).

type SuccessResponse<T = null> = ActionResponse<T> & { success: true };

// NOTE:
// extends:
// Działa tylko w interface i tylko z innymi interfejsami (lub typami, które są "kształtem" obiektu).

// Nie zrobisz tego z uniami czy prymitywami.

// &:
// Działa z dowolnymi typami w type, więc możesz łączyć obiekty, unie, prymitywy itd.

// undefined – "wartość nie została zdefiniowana" (np. brak danych jest domyślny w błędzie).

type ErrorResponse = ActionResponse<undefined> & { success: false };

type APIErrorResponse = NextResponse<ErrorResponse>;
type APIResponse<T = null> = NextResponse<SuccessResponse<T> | ErrorResponse>; // To unia typów, która mówi, że odpowiedź API może być albo sukcesem, albo błędem.

// NOTE: W SuccessResponse<T> dane (data) mogą być dowolnego typu (lub null), a w ErrorResponse są zawsze undefined.

// NextResponse<SuccessResponse<T> | ErrorResponse> opakowuje tę unię, co oznacza, że odpowiedź HTTP będzie zawierała albo { success: true, data: T }, albo { success: false, data: undefined }.

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

// difference between params and searchParams
// params: /questions/:id
// searchParams: /questions?tag=javascript

interface PaginatedSearchParams {
  page?: number;
  pageSize?: number;
  query?: string;
  filter?: string;
  sort?: string;
}

interface Answer {
  _id: string;
  author: Author;
  content: string;
  createdAt: Date;
}

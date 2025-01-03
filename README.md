# Magic Loop: An experimental Web Component framework

Magic Loop is an experimental approach to managing front-end state using Web Components and Asynchronous Generators. Under the hood, it uses `webjsx`.

1. **Web Components**: All components are Web Components, which you can re-use natively or from any framework.
2. **Asynchronous Generators**: Rendering is done with an asynchronous generator, yielding dynamic JSX views as the state changes.
3. **Declarative Routing**: Define routes and associate them with components using the `magic-loop-router` API.

If you want to dive right into code, here's an [HN Homepage example](https://stackblitz.com/edit/magic-loop-hn) on StackBlitz. <br />
This article might be interesting: https://webjsx.org/magic-loop/

## Installation

To use Magic Loop in your project:

```bash
npm install magic-loop magic-loop-router webjsx
```

### TypeScript

Ensure your `tsconfig.json` is set up to handle JSX.

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "webjsx"
  }
}
```

Advanced instructions can be found on [WebJSX](https://webjsx.org).

## Declaring Components

A component in Magic Loop is defined with the `component` function, which takes three parameters: the component's name, an asynchronous generator function (or a regular function), and an optional default properties object. The generator function is where the rendering logic is implemented, yielding views dynamically as the component's state changes. The optional properties object can be used to initialize default settings for the component.

Here's an example of a click-counter component:

```ts
import { component } from "magic-loop";

component("click-counter", async function* (component) {
  let count = 0;

  while (true) {
    yield (
      <div>
        <p>Count: {count}</p>
        <button
          onclick={() => {
            count++;
            component.render();
          }}
        >
          Increment
        </button>
      </div>
    );
  }
});
```

In this example, the `while (true)` loop enables continuous rendering, with the `yield` keyword producing new views whenever the state changes. The `component.render()` method is called to trigger these updates, ensuring that the UI reflects the latest state (in this case, the current count).

In cases where a component's output does not need to update dynamically, you can return a static JSX view right away. This is ideal for simpler components where the content is either fixed or determined only once. For example:

```ts
component("static-component", async function* (component) {
  return (
    <div>
      <h1>Welcome to Magic Loop!</h1>
      <p>This is a static component.</p>
    </div>
  );
});
```

Properties are defined as part of the component declaration, with default values specified in the optional third parameter. Here is an example:

```ts
component(
  "custom-title",
  async function* (component: HTMLElement & { title: string }) {
    yield <h2>{component.title}</h2>;
  },
  { title: "Default Title" }
);
```

This component displays a heading using the `title` property. If no title is provided, the default value "Default Title" is used. For a Web Component to have a prop or an attribute, it must declare them in this manner with default values.

If you want to jump right into the code, you can edit the [HN example on StackBlitz](https://stackblitz.com/edit/magic-loop-hn).

## Lifecycle Methods

Components in Magic Loop support lifecycle methods through the ComponentOptions parameter:

```ts
component(
  "lifecycle-example",
  async function* (component) {
    yield <div>Content</div>;
  },
  {}, // default props
  {
    onConnected: (component) => {
      // Called when component is added to DOM
      console.log("Component connected");
    },
    onDisconnected: (component) => {
      // Called when component is removed from DOM
      console.log("Component disconnected");
    },
  }
);
```

The lifecycle methods are:

- `onConnected`: Called when the component is added to the DOM. Use this to initialize resources, start data fetching, or set up subscriptions.
- `onDisconnected`: Called when the component is removed from the DOM. Use this to clean up resources, cancel pending requests, or remove event listeners.

These methods help manage side effects and resources throughout the component's lifecycle.

## Building an HN Clone

Let's build a Hacker News (HN) clone using Magic Loop. This example demonstrates how to create a full-featured web application with components, routing, data fetching, and state management.

### Story List - The Home Page

The home page displays a curated list of top stories from Hacker News. When the component mounts, it fetches the IDs of top stories from the HN API, then retrieves detailed data for the top 20 stories. Each story is displayed with its title, score, author link, and comment count. The component handles loading states and provides clear feedback to users while data is being fetched.

```ts
component("story-list", async function* (component: HTMLElement & Component) {
  let stories = null as Story[] | null;

  const fetchTopStories = async (limit = 30) => {
    const topIds = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    ).then((res) => res.json());
    const sliced = topIds.slice(0, limit);
    stories = await Promise.all(
      sliced.map((id: number) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
          (r) => r.json()
        )
      )
    );
    component.render();
  };

  fetchTopStories();

  while (true) {
    if (stories === null) {
      yield (
        <div style="padding: 2em; background: gray; border-radius: 8px">
          Loading top stories...
        </div>
      );
    } else {
      yield (
        <div>
          <hn-header />
          <div class="story-list">
            {stories.slice(0, 10).map((story: Story, index: number) => (
              <div class="story-list-item">
                <span class="rank">{index + 1}.</span>
                <span>
                  <a class="title-link" href="#" onclick={() => {}}>
                    {story.title}
                  </a>
                  {story.url && (
                    <span class="meta">
                      {" "}
                      <a
                        href={story.url}
                        class="host"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        ({new URL(story.url).hostname.replace("www.", "")})
                      </a>
                    </span>
                  )}
                </span>
                <div class="meta">
                  {story.score} points by <user-link username={story.by} />{" "}
                  <a href="#" onclick={() => {}}>
                    {story.descendants || 0} comments
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }
});
```

### Story Detail Page

When a user clicks on a story title, they're taken to the story detail page. This component fetches and displays comprehensive information about a single story, including its title (linked to the original URL), score, author, and the full comment thread. It provides a back navigation link and gracefully handles cases where the story might not be found.

```ts
component(
  "story-detail",
  async function* (component: HTMLElement & Component & { storyid: number }) {
    let story: Story | null = null;

    const fetchData = async (): Promise<Story | null> => {
      try {
        const result = await fetchItem<Story>(component.storyid);
        return result;
      } catch {
        return null;
      }
    };

    story = await fetchData();

    while (true) {
      if (!story?.id) {
        yield (
          <div>
            <a class="back-link" href="#" onclick={() => router.goto("/")}>
              Back
            </a>
            <div>Story not found.</div>
          </div>
        );
      } else {
        return (
          <div>
            <a class="back-link" href="#" onclick={() => router.goto("/")}>
              &larr; Back
            </a>
            <h2>
              <a href={story.url} target="_blank" rel="noopener noreferrer">
                {story.title}
              </a>
            </h2>
            <div class="meta">
              {story.score} points by <user-link username={story.by} /> |{" "}
              {story.descendants || 0} comments
            </div>
            <hr />
            <comment-thread parentid={story.id} />
          </div>
        );
      }
    }
  },
  { storyid: 0 }
);
```

### Comment Thread Component

This component manages the top-level structure of a story's comment thread. It fetches the list of comments for a given story and renders them as a discussion thread. If there are no comments, it displays an appropriate message.

```ts
component(
  "comment-thread",
  async function* (component: HTMLElement & Component & { parentid: number }) {
    let parentData: CommentData | null = null;

    const fetchData = async (): Promise<CommentData | null> => {
      try {
        const result = await fetchItem<CommentData>(component.parentid);
        return result;
      } catch {
        return null;
      }
    };

    parentData = await fetchData();

    while (true) {
      if (!parentData?.kids?.length) {
        yield <div>No comments yet.</div>;
      } else {
        return (
          <div class="comments-container">
            {parentData.kids.map((kidId: number) => (
              <comment-item commentid={kidId} />
            ))}
          </div>
        );
      }
    }
  },
  { parentid: 0 }
);
```

### Comment Item Component

This component handles the display of individual comments, including any nested replies. It supports text comments and implements indentation for nested comments. The component gracefully handles deleted comments and missing content.

```ts
component(
  "comment-item",
  async function* (component: HTMLElement & Component & { commentid: number }) {
    let commentData: CommentData | null = null;

    const fetchData = async (): Promise<CommentData | null> => {
      try {
        const result = await fetchItem<CommentData>(component.commentid);
        return result;
      } catch {
        return null;
      }
    };

    commentData = await fetchData();

    while (true) {
      if (!commentData?.id) {
        yield <div class="comment">(deleted)</div>;
      } else {
        return (
          <div class="comment">
            <div class="comment-meta">
              {commentData.by ? (
                <user-link username={commentData.by} />
              ) : (
                "(deleted)"
              )}
            </div>
            <div
              class="comment-text"
              {...{ innerHTML: commentData.text || "(no text)" }}
            ></div>
            {commentData.kids && commentData.kids.length > 0 && (
              <div class="nested-comments" style="margin-left: 20px;">
                {commentData.kids.map((kidId: number) => (
                  <comment-item commentid={kidId} />
                ))}
              </div>
            )}
          </div>
        );
      }
    }
  },
  { commentid: 0 }
);
```

### User Profile Page

The user profile page displays the user's karma score, account creation date, about section (if available), and a list of their recent submissions. The component implements type guards to ensure data integrity and handles missing or invalid user data appropriately.

```ts
component(
  "user-profile",
  async function* (component: HTMLElement & Component & { username: string }) {
    let userData: UserData | null = null;
    let userStories: Story[] = [];

    const fetchUser = async (username: string): Promise<UserData> => {
      return fetch(
        `https://hacker-news.firebaseio.com/v0/user/${username}.json`
      ).then((r) => r.json());
    };

    const fetchData = async (): Promise<[UserData | null, Story[]]> => {
      try {
        const user = await fetchUser(component.username);
        const submissions = user.submitted || [];
        const stories = await Promise.all(
          submissions.slice(0, 10).map((id) => fetchItem<Story>(id))
        );
        return [
          user,
          stories.filter(
            (s): s is Story =>
              typeof s?.id === "number" &&
              typeof s?.title === "string" &&
              typeof s?.score === "number" &&
              typeof s?.by === "string"
          ),
        ];
      } catch {
        return [null, []];
      }
    };

    [userData, userStories] = await fetchData();

    while (true) {
      if (!userData) {
        yield (
          <div>
            <a class="back-link" href="#" onclick={() => router.goto("/")}>
              Back
            </a>
            <div>User not found.</div>
          </div>
        );
      } else {
        return (
          <div>
            <a class="back-link" href="#" onclick={() => router.goto("/")}>
              &larr; Back
            </a>
            <h2>User: {userData.id}</h2>
            <div class="user-info">
              <p>Karma: {userData.karma}</p>
              <p>
                Created:{" "}
                {new Date(userData.created * 1000).toLocaleDateString()}
              </p>
              {userData.about && (
                <div class="about">
                  <h3>About</h3>
                  <div {...{ innerHTML: userData.about }}></div>
                </div>
              )}
            </div>
            <div class="user-submissions">
              <h3>Recent Submissions</h3>
              {userStories.map((story) => (
                <div class="story-list-item">
                  <a href="#" onclick={() => router.goto(`/story/${story.id}`)}>
                    {story.title}
                  </a>
                  <div class="meta">
                    {story.score} points | {story.descendants || 0} comments
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
  },
  { username: "" }
);
```

### User Link Component

A utility component used throughout the application to create consistent user profile links. It takes a username prop and renders a clickable link that navigates to that user's profile page.

```ts
component(
  "user-link",
  async function* (component: HTMLElement & Component & { username: string }) {
    return (
      <a href="#" onclick={() => router.goto(`/user/${component.username}`)}>
        {component.username}
      </a>
    );
  },
  { username: "" }
);
```

### Header Component

The header component implements the classic Hacker News navigation bar, including the Y Combinator logo and navigation links. This component provides consistent navigation across all pages of the application.

````ts
component("hn-header", async function* (component: HTMLElement & Component) {
  while (true) {
    yield (
      <div class="hn-header">
        <div class="hn-header-content">
          <a href="#" class="hn-logo">
            Y
          </a>
          Here's the continuation of the README.md file: ```markdown
          <a href="#" class="hn-header-text">
            <b>Hacker News</b>
          </a>
          <a href="#" class="hn-header-link">
            new
          </a>
          <span class="hn-header-separator">|</span>
          <a href="#" class="hn-header-link">
            past
          </a>
          <span class="hn-header-separator">|</span>
          <a href="#" class="hn-header-link">
            comments
          </a>
          <span class="hn-header-separator">|</span>
          <a href="#" class="hn-header-link">
            ask
          </a>
          <span class="hn-header-separator">|</span>
          <a href="#" class="hn-header-link">
            show
          </a>
          <span class="hn-header-separator">|</span>
          <a href="#" class="hn-header-link">
            jobs
          </a>
          <span class="hn-header-separator">|</span>
          <a href="#" class="hn-header-link">
            submit
          </a>
        </div>
      </div>
    );
  }
});
````

### Application Types

The application uses TypeScript interfaces to ensure type safety across components:

```ts
type Story = {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  descendants?: number;
  kids?: number[];
};

type CommentData = {
  id: number;
  by: string;
  text: string;
  kids?: number[];
};

type UserData = {
  id: string;
  created: number;
  karma: number;
  about?: string;
  submitted?: number[];
};
```

### Routing Setup

Finally, we configure the routes for our application:

```ts
import { Router } from "magic-loop-router";

const router = new Router("app");

router.page("/", async function* () {
  return <story-list />;
});

router.page("/story/:id", async function* (params) {
  const storyId = parseInt(params.id, 10);
  return <story-detail storyid={storyId} />;
});

router.page("/user/:id", async function* (params) {
  return <user-profile username={params.id} />;
});

router.goto("/");
```

This example demonstrates how Magic Loop components work together to create a full-featured web application, handling data fetching, state management, routing, and complex UI interactions.

## License

MIT

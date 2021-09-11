import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import { FiUser, FiCalendar } from "react-icons/fi";
import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';
import styles from './home.module.scss';
import Header from '../components/Header';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const postsFormatted = postsPagination.results.map(post => {
    return{
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        "dd MMM yyyy",
        {
          locale:ptBR,
        }
      ),
    }

  })
  const [posts,setPosts] = useState<Post[]>(postsFormatted);
  const [nextPage,setNextPage] = useState(postsPagination.next_page);
  const [nextPageExists,setNextPageExists] = useState(1)

  async function handleMorePosts(){
    if(nextPageExists !== 1 && nextPage === null){
      return;
    }
    const postsResult = await fetch(`${nextPage}`).then(response =>
      response.json()
    );

    setNextPage(postsResult.next_page);
    setNextPageExists(postsResult.page);

    const loadNewPosts = postsResult.results.map(post=> {
      return {
        uid:post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          "dd MMM yyyy",
          {
            locale:ptBR,
          }
        ),
        data:{
          title:post.data.title,
          subtitle:post.data.subtitle,
          author:post.data.author
        }
      }
    })
    setPosts([...posts,...loadNewPosts]);
  }

  return (
    <>
      <Head>
        <title>SpaceTraveling</title>
      </Head>
      <Header/>
      <main className={styles.container}>
        <div className={styles.postList}>
          {posts.map(post => { return (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <footer>
                  <span>
                    <FiCalendar />
                    <time>
                      {post.first_publication_date}
                    </time>
                  </span>
                  <span>
                    <FiUser/>
                    <span>{post.data.author}</span>
                  </span>
                </footer>
              </a>
            </Link>
          );})}
          { postsPagination.next_page && (
            <button
              type="button"
              className={styles.more}
              onClick={handleMorePosts}
            >
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps:GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type','posts')
  ], {
    fetch: ['posts.title','posts.subtitle','posts.author'],
    pageSize: 2
  });

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  const next_page = postsResponse.next_page

  return {
    props: {
      postsPagination: {
        results,
        next_page
      }
    }
  }
};

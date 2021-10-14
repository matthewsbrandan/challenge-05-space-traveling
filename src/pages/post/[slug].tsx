import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import Header from '../../components/Header';

import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';

import { FiUser, FiCalendar } from "react-icons/fi";
import { BiTime } from "react-icons/bi";

import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}
interface OutherPost{
  uid: string;
  title: string;  
}

interface PostProps {
  post: Post;
  nextPost?: OutherPost;
  prevPost?: OutherPost;
}

export default function Post({ post, prevPost, nextPost}: PostProps) {
  const totalWords = post.data.content.reduce((total,contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length)
    words.map(word => (total+= word))
    return total;
  }, 0);
  const readTime = Math.ceil(totalWords / 200);

  const formateDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale:ptBR
    }
  )

  const formateDateUpdated = post.last_publication_date ? format(
    new Date(post.first_publication_date),
    "dd MMM yyyy, 'às' h:mm",
    {
      locale:ptBR
    }
  )  : null;

  const {isFallback} = useRouter();
  if(isFallback) return (<p>Carregando...</p>);

  const commentBox = useRef(null);

  useEffect(() => {
    if(process.browser) makeCommentUtteranc();
  },[]);

  function makeCommentUtteranc(){
    let scriptEl = document.createElement("script");
    scriptEl.setAttribute('src',"https://utteranc.es/client.js");
    scriptEl.setAttribute('repo',"matthewsbrandan/challenge-05-space-traveling");
    scriptEl.setAttribute('issue-term',"url");
    scriptEl.setAttribute('theme',"github-dark");
    scriptEl.setAttribute('crossorigin',"anonymous");
    scriptEl.setAttribute('async', String(true));
    commentBox.current.innerHTML = '';
    commentBox.current.appendChild(scriptEl);
  }

  return (
    <>
      <Head>
        <title>SpaceTraveling | {post.data.title}</title>
      </Head>
      <div>
        <Header/>
        <img src={post.data.banner.url} alt="banner" className={styles.banner}/>
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfo}>
            <span>
              <FiCalendar />
              <span>{ formateDate }</span>
            </span>
            <span>
              <FiUser/>
              <span>{post.data.author}</span>
            </span>
            <span>
              <BiTime/>
              <span>{ readTime } min</span>
            </span>
          </div>
          { formateDateUpdated ? (
            <em className={styles.updated_at}> * editado em <span>{
              formateDateUpdated.split(',')[0]
            },</span>{formateDateUpdated.split(',')[1]} </em>
          ) : ''}
          <section className={styles.content}>
            {post.data.content.map((content, index) => { return (
              <div key={index}>
                <strong className={styles.title}>{content.heading}</strong>
                { content.body.map((body, subIndex) => { return(
                  <div
                    dangerouslySetInnerHTML={{ __html: body.text }}
                    key={subIndex}
                    className={styles.body}
                  />
                );})}
              </div>
            );})}
          </section>
          <div className={styles.outherPosts}>
            <hr />
            {prevPost ? (
              <Link href={`/post/${prevPost.uid}`}>
                <a>
                  <span>{prevPost.title}</span>
                  <strong>Post anterior</strong>
                </a>
              </Link>
            ) : <a></a>}
            {nextPost ? (
              <Link href={`/post/${nextPost.uid}`}>
                <a style={{ textAlign: "right" }}>
                  <span>{nextPost.title}</span>
                  <strong>Próximo post</strong>
                </a>
              </Link>
            ):''}
          </div>
          <div ref={commentBox}></div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths:GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type','posts')
  ], {
    fetch: ['posts.title'],
    pageSize: 2
  });

  const results = postsResponse.results.map(post =>  ({
    params: {slug: post.uid},
  }));

  return {
    paths: results,
    fallback: 'blocking'
  }
};

export const getStaticProps:GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts',params.slug as string,{});

  const result = {
    uid:response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: response.data
  }

  const prevPostRespose = await prismic.query([
    Prismic.predicates.at('document.type','posts')
  ], {
    fetch: ['posts.title','posts.subtitle','posts.author'],
    pageSize: 1,
    after: response.id,
    orderings: '[document.first_publication_date desc]'
  });

  const prevPost = prevPostRespose.results.length > 0 ? {
    uid: prevPostRespose.results[0].uid,
    title: prevPostRespose.results[0].data.title,
  } : null;

  const nextPostRespose = await prismic.query([
    Prismic.predicates.at('document.type','posts')
  ], {
    fetch: ['posts.title','posts.subtitle','posts.author'],
    pageSize: 1,
    after: response.id,
    orderings: '[document.first_publication_date]'
  });

  const nextPost = nextPostRespose.results.length > 0 ? {
    uid: nextPostRespose.results[0].uid,
    title: nextPostRespose.results[0].data.title,
  } : null;

  return {
    props: {
      post: result,
      nextPost,
      prevPost
    }
  }
};

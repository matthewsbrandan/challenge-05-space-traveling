import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import Header from '../../components/Header';

import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';

import { FiUser, FiCalendar } from "react-icons/fi";
import { BiTime } from "react-icons/bi";

import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
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

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
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

  const {isFallback} = useRouter()
  if(isFallback) return (<p>Carregando...</p>) 

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
    data: response.data
  }

  return {
    props: {
      post: result
    }
  }
};

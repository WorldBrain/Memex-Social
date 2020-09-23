import DOMPurify from "dompurify";
import moment from "moment";
import React from "react";
import styled from "styled-components";
import { Margin } from "styled-components-spacing";
import { SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";
import ItemBox from "../components/item-box";

const StyledAnnotationBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  padding: 15px 20px;
`;

const AnnotationBody = styled.span`
  background-color: ${(props) => props.theme.colors.secondary};
  white-space: normal;
  padding: 0 5px;
  box-decoration-break: clone;
  font-size: 14px;
  color: ${(props) => props.theme.colors.primary};
`;

const AnnotationComment = styled.div`
  font-size: 14px;
  color: ${(props) => props.theme.colors.primary};
`;
const AnnotationDate = styled.div`
  font-family: "Poppins";
  font-weight: normal;
  font-size: 12px;
  color: ${(props) => props.theme.colors.primary};
`;

const DOM_PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ["p", "br", "#text"],
  ALLOWED_ATTR: [],
};

const preserveLinebreaks = (s: string) =>
  DOMPurify.sanitize(s.replace(/\n/g, "<br>"), DOM_PURIFY_CONFIG) as string;

export default function AnnotationBox(props: {
  annotation: Pick<SharedAnnotation, "body" | "comment" | "createdWhen">;
}) {
  const { annotation } = props;
  console.log({
    orig: annotation.comment,
    preserved: annotation.comment && preserveLinebreaks(annotation.comment),
  });
  return (
    <ItemBox>
      <StyledAnnotationBox>
        {annotation.body && (
          <Margin bottom="small">
            <AnnotationBody>{annotation.body}</AnnotationBody>
          </Margin>
        )}
        <Margin bottom="small">
          <AnnotationComment
            dangerouslySetInnerHTML={{
              __html: annotation.comment
                ? preserveLinebreaks(annotation.comment)
                : "",
            }}
          />
        </Margin>
        <AnnotationDate>
          {moment(annotation.createdWhen).format("LLL")}
        </AnnotationDate>
      </StyledAnnotationBox>
    </ItemBox>
  );
}

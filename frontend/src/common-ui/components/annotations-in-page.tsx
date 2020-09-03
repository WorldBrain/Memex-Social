import React from "react";
import styled from "styled-components";
import { UITaskState } from "../../main-ui/types";
import LoadingIndicator from "./loading-indicator";
import ErrorBox from "./error-box";
import { Margin } from "styled-components-spacing";
import { SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";
import AnnotationBox from "./annotation-box";

const AnnotationContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const AnnotationLine = styled.span`
  height: auto;
  width: 6px;
  background: #e0e0e0;
  margin: -8px 10px 5px;
`;

const AnnotationList = styled.div`
  min-height: 50px;
`;

const CenteredContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export default function AnnotationsInPage(props: {
  loadState: UITaskState;
  annotations?: SharedAnnotation[] | null;
}) {
  if (props.loadState === "pristine" || props.loadState === "running") {
    return (
      <AnnotationContainer>
        <AnnotationLine />
        <AnnotationList>
          <CenteredContent>
            <LoadingIndicator />
          </CenteredContent>
        </AnnotationList>
      </AnnotationContainer>
    );
  }

  if (props.loadState === "error") {
    return (
      <AnnotationContainer>
        <AnnotationLine />
        <Margin bottom={"medium"}>
          <CenteredContent>
            <ErrorBox>
              Error loading page notes. <br /> Reload page to retry.
            </ErrorBox>
          </CenteredContent>
        </Margin>
      </AnnotationContainer>
    );
  }

  if (!props.annotations) {
    return null;
  }

  return (
    <AnnotationContainer>
      <AnnotationLine />
      <AnnotationList>
        {props.annotations.map(
          (annotation, annotationIndex) =>
            annotation && (
              <Margin key={annotationIndex} bottom={"smallest"}>
                <AnnotationBox annotation={annotation} />
              </Margin>
            )
        )}
      </AnnotationList>
    </AnnotationContainer>
  );
}
